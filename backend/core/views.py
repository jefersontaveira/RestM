import json
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Tenant, UserProfile, Category, Item, Table, Order, OrderItem
from .serializers import (
    TenantSerializer,
    CategorySerializer,
    ItemSerializer,
    TableSerializer,
    OrderSerializer,
    OrderItemSerializer,
    PublicCategorySerializer
)

# ==============================================================================
# Helper de Identificação do Tenant
# ==============================================================================
def get_user_tenant(user):
    """
    Retorna o Tenant do usuário autenticado.
    Superusuários sem tenant vinculado são associados ao primeiro Tenant disponível.
    """
    if not user or not user.is_authenticated:
        return None

    profile = getattr(user, 'profile', None)
    if profile and profile.tenant:
        return profile.tenant

    if user.is_superuser:
        tenant = Tenant.objects.first()
        if not tenant:
            tenant = Tenant.objects.create(name="Restaurante Matriz", slug="matriz")
        if profile:
            profile.tenant = tenant
            profile.save()
        else:
            UserProfile.objects.create(user=user, tenant=tenant, role='admin')
        return tenant

    return None

# ==============================================================================
# Autenticação Customizada (Retorna Token + Dados do Tenant)
# ==============================================================================
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        tenant = get_user_tenant(user)

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'is_superuser': user.is_superuser,
            'tenant': {
                'id': tenant.id if tenant else None,
                'name': tenant.name if tenant else "Restaurante",
                'slug': tenant.slug if tenant else "matriz",
                'logo': request.build_absolute_uri(tenant.logo.url) if tenant and tenant.logo else None,
                'primary_color': tenant.primary_color if tenant else "#F59E0B",
                'secondary_color': tenant.secondary_color if tenant else "#1E1E1E",
            } if tenant else None
        })

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = get_user_tenant(request.user)
        return Response({
            'username': request.user.username,
            'is_superuser': request.user.is_superuser,
            'tenant': TenantSerializer(tenant).data if tenant else None
        })

# ==============================================================================
# ViewSet Base com Isolamento Rigoroso de Tenant
# ==============================================================================
class TenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant = get_user_tenant(self.request.user)
        if not tenant:
            return self.queryset.none()
        return self.queryset.filter(tenant=tenant)

    def perform_create(self, serializer):
        tenant = get_user_tenant(self.request.user)
        if not tenant:
            raise exceptions.PermissionDenied("Usuário sem estabelecimento vinculado.")
        serializer.save(tenant=tenant)

# ==============================================================================
# Categorias, Itens e Mesas
# ==============================================================================
class CategoryViewSet(TenantScopedViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ItemViewSet(TenantScopedViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class TableViewSet(TenantScopedViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer

# ==============================================================================
# Pedidos (Com blindagem de histórico e isolamento)
# ==============================================================================
class OrderViewSet(TenantScopedViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        tenant = get_user_tenant(self.request.user)
        if not tenant:
            return Order.objects.none()

        queryset = Order.objects.filter(tenant=tenant)

        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if status_param:
            queryset = queryset.filter(status=status_param)

        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) |
                Q(table__identification__icontains=search) |
                Q(saved_table_name__icontains=search)
            )

        queryset = queryset.order_by('-closed_at', '-created_at')

        if self.action == 'list':
            limit = self.request.query_params.get('limit')
            offset = self.request.query_params.get('offset')
            if limit:
                start = int(offset) if offset else 0
                end = start + int(limit)
                return queryset[start:end]

        return queryset

    def perform_update(self, serializer):
        instance = self.get_object()

        # Blindagem: Pedido já finalizado não pode ser reaberto ou ter status alterado
        novo_status = serializer.validated_data.get('status', instance.status)
        if instance.status == 'finalizado' and novo_status == 'aberto':
            raise exceptions.ValidationError({"detail": "Pedidos finalizados são imutáveis e não podem ser reabertos."})

        # Ao finalizar o pedido, congela dados históricos
        if novo_status == 'finalizado':
            if instance.table and not instance.saved_table_name:
                serializer.validated_data['saved_table_name'] = instance.table.identification

            # Congela todos os itens pertencentes
            for order_item in instance.items.all():
                if order_item.item:
                    if not order_item.saved_item_name:
                        order_item.saved_item_name = order_item.item.name
                    if not order_item.unit_price:
                        order_item.unit_price = order_item.item.price
                    order_item.save()

            if not serializer.validated_data.get('closed_at') and not instance.closed_at:
                serializer.validated_data['closed_at'] = timezone.now()

        serializer.save()

# ==============================================================================
# Itens do Pedido (Blindagem contra alteração em pedidos finalizados)
# ==============================================================================
class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tenant = get_user_tenant(self.request.user)
        if not tenant:
            return OrderItem.objects.none()
        return OrderItem.objects.filter(order__tenant=tenant)

    def perform_create(self, serializer):
        order = serializer.validated_data.get('order')
        tenant = get_user_tenant(self.request.user)

        if not order or order.tenant != tenant:
            raise exceptions.PermissionDenied("Pedido não pertence ao seu estabelecimento.")

        if order.status == 'finalizado':
            raise exceptions.ValidationError({"detail": "Não é permitido adicionar itens a um pedido finalizado."})

        item = serializer.validated_data.get('item')
        saved_name = item.name if item else "Item"
        unit_price = item.price if item else 0

        serializer.save(
            saved_item_name=saved_name,
            unit_price=unit_price
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.order.status == 'finalizado':
            raise exceptions.ValidationError({"detail": "Não é permitido alterar itens de um pedido finalizado."})
        serializer.save()

    def perform_destroy(self, instance):
        if instance.order.status == 'finalizado':
            raise exceptions.ValidationError({"detail": "Não é permitido remover itens de um pedido finalizado."})
        instance.delete()

# ==============================================================================
# Configurações do Restaurante (Horários, Logo, Cores)
# ==============================================================================
class TenantSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        tenant = get_user_tenant(request.user)
        if not tenant:
            return Response({"detail": "Estabelecimento não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = TenantSerializer(tenant, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        tenant = get_user_tenant(request.user)
        if not tenant:
            return Response({"detail": "Estabelecimento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        # Trata dados multipart/form-data ou json em um dict Python puro
        data = {}
        for key in request.data:
            if key in ('operating_hours', 'address_details'):
                raw = request.data.get(key)
                if isinstance(raw, str):
                    try:
                        data[key] = json.loads(raw)
                    except Exception:
                        data[key] = raw
                else:
                    data[key] = raw
            elif key == 'logo':
                if request.FILES.get('logo'):
                    data['logo'] = request.FILES['logo']
            else:
                data[key] = request.data.get(key)

        # Se houver arquivo de logo enviado separadamente
        if 'logo' not in data and request.FILES.get('logo'):
            data['logo'] = request.FILES['logo']

        serializer = TenantSerializer(tenant, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==============================================================================
# Cardápio Digital Público (/api/cardapio/<slug>/)
# ==============================================================================
class PublicCardapioView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        tenant = None
        # Suporte a ID permanente (o QR Code nunca muda mesmo se o nome/slug mudar)
        if str(slug).isdigit():
            tenant = Tenant.objects.filter(id=int(slug)).first()

        if not tenant:
            tenant = Tenant.objects.filter(slug=slug).first()

        if not tenant:
            # Fallback inteligente: se pesquisou 'matriz' ou outro slug não encontrado,
            # busca o tenant principal para nunca deixar o cliente na mão
            tenant = Tenant.objects.first()
            if not tenant:
                return Response({"detail": "Restaurante ou cardápio não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        # Checagem de funcionamento atual
        is_open = self._check_is_open(tenant.operating_hours)

        # Categorias e itens disponíveis deste tenant
        categorias = Category.objects.filter(tenant=tenant).prefetch_related('items')
        categorias_data = PublicCategorySerializer(categorias, many=True, context={'request': request}).data

        # Filtrar apenas categorias que possuem itens disponíveis
        categorias_com_itens = [c for c in categorias_data if len(c.get('items', [])) > 0]

        logo_url = request.build_absolute_uri(tenant.logo.url) if tenant.logo else None

        return Response({
            'tenant': {
                'id': tenant.id,
                'name': tenant.name,
                'slug': tenant.slug,
                'logo': logo_url,
                'primary_color': tenant.primary_color,
                'secondary_color': tenant.secondary_color,
                'phone': tenant.phone,
                'address': tenant.address,
                'address_details': tenant.address_details,
                'operating_hours': tenant.operating_hours,
                'is_open': is_open
            },
            'categorias': categorias_com_itens
        })

    def _check_is_open(self, operating_hours):
        if not operating_hours or not isinstance(operating_hours, dict):
            return True

        # Dias da semana: 0=segunda ... 6=domingo
        dias_map = {0: 'seg', 1: 'ter', 2: 'qua', 3: 'qui', 4: 'sex', 5: 'sab', 6: 'dom'}
        agora = timezone.localtime()
        dia_atual = dias_map.get(agora.weekday(), 'seg')

        config_dia = operating_hours.get(dia_atual)
        if not config_dia or not config_dia.get('aberto', True):
            return False

        hora_inicio = config_dia.get('inicio', '00:00')
        hora_fim = config_dia.get('fim', '23:59')

        try:
            h_ini, m_ini = map(int, hora_inicio.split(':'))
            h_fim, m_fim = map(int, hora_fim.split(':'))

            hora_atual_min = agora.hour * 60 + agora.minute
            ini_min = h_ini * 60 + m_ini
            fim_min = h_fim * 60 + m_fim

            if ini_min <= fim_min:
                return ini_min <= hora_atual_min <= fim_min
            else:
                # Passa da meia-noite (ex: 18:00 às 02:00)
                return hora_atual_min >= ini_min or hora_atual_min <= fim_min
        except Exception:
            return True

# ==============================================================================
# Motor de Relatórios (Diário, Mensal, Anual & Métodos de Pagamento)
# ==============================================================================
class RelatoriosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = get_user_tenant(request.user)
        if not tenant:
            return Response({"detail": "Estabelecimento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        periodo = request.query_params.get('periodo', 'mensal') # 'diario', 'mensal', 'anual'
        agora = timezone.localtime()

        base_queryset = Order.objects.filter(tenant=tenant, status='finalizado')

        # Filtro de Data
        if periodo == 'diario':
            # Últimos 30 dias
            data_limite = (agora - timedelta(days=29)).replace(hour=0, minute=0, second=0)
            pedidos = base_queryset.filter(closed_at__gte=data_limite)
        elif periodo == 'anual':
            # Ano corrente
            inicio_ano = agora.replace(month=1, day=1, hour=0, minute=0, second=0)
            pedidos = base_queryset.filter(closed_at__gte=inicio_ano)
        else: # mensal
            # Mês corrente
            inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0)
            pedidos = base_queryset.filter(closed_at__gte=inicio_mes)

        # 1. Totais Gerais do Período
        agregados = pedidos.aggregate(
            faturamento=Sum('total'),
            total_pedidos=Count('id'),
            total_troco=Sum('change')
        )
        faturamento_total = float(agregados['faturamento'] or 0.0)
        total_pedidos = agregados['total_pedidos'] or 0
        total_troco = float(agregados['total_troco'] or 0.0)
        ticket_medio = (faturamento_total / total_pedidos) if total_pedidos > 0 else 0.0

        # 2. Distribuição por Método de Pagamento
        metodos_labels = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'credito': 'Cartão de Crédito',
            'debito': 'Cartão de Débito',
            'outro': 'Outro / Não especificado'
        }

        pagamentos_agg = pedidos.values('payment_method').annotate(
            quantidade=Count('id'),
            total=Sum('total')
        ).order_by('-total')

        por_metodo_pagamento = []
        for p in pagamentos_agg:
            m_key = p['payment_method'] or 'outro'
            m_total = float(p['total'] or 0.0)
            m_qtd = p['quantidade'] or 0
            por_metodo_pagamento.append({
                'metodo': m_key,
                'label': metodos_labels.get(m_key, m_key.title()),
                'quantidade': m_qtd,
                'total': m_total,
                'percentual': round((m_total / faturamento_total * 100), 1) if faturamento_total > 0 else 0
            })

        # 3. Série Temporal
        serie_temporal = []
        if periodo == 'diario':
            # Dias dos últimos 30 dias
            dias_dict = {}
            for i in range(30):
                d = (agora - timedelta(days=29 - i)).date()
                dias_dict[d.strftime('%Y-%m-%d')] = {'data': d.strftime('%d/%m'), 'total': 0.0, 'pedidos': 0}

            for p in pedidos:
                if p.closed_at:
                    local_dt = timezone.localtime(p.closed_at).date().strftime('%Y-%m-%d')
                    if local_dt in dias_dict:
                        dias_dict[local_dt]['total'] += float(p.total)
                        dias_dict[local_dt]['pedidos'] += 1

            serie_temporal = list(dias_dict.values())

        elif periodo == 'mensal':
            # Dias do mês atual
            dias_no_mes = {}
            dia_1 = agora.replace(day=1).date()
            prox_mes = (dia_1.replace(day=28) + timedelta(days=4)).replace(day=1)
            ultimo_dia = (prox_mes - timedelta(days=1)).day

            for d in range(1, ultimo_dia + 1):
                key = f"{d:02d}"
                dias_no_mes[key] = {'data': f"{d:02d}", 'total': 0.0, 'pedidos': 0}

            for p in pedidos:
                if p.closed_at:
                    d_str = timezone.localtime(p.closed_at).strftime('%d')
                    if d_str in dias_no_mes:
                        dias_no_mes[d_str]['total'] += float(p.total)
                        dias_no_mes[d_str]['pedidos'] += 1

            serie_temporal = list(dias_no_mes.values())

        elif periodo == 'anual':
            # 12 meses do ano
            meses_nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            meses_dict = {i + 1: {'mes': meses_nomes[i], 'total': 0.0, 'pedidos': 0} for i in range(12)}

            for p in pedidos:
                if p.closed_at:
                    m_num = timezone.localtime(p.closed_at).month
                    if m_num in meses_dict:
                        meses_dict[m_num]['total'] += float(p.total)
                        meses_dict[m_num]['pedidos'] += 1

            serie_temporal = list(meses_dict.values())

        # 4. Top 5 Itens Mais Vendidos
        top_itens = OrderItem.objects.filter(
            order__in=pedidos
        ).values('saved_item_name').annotate(
            quantidade=Sum('quantity'),
            total_gerado=Sum(F('quantity') * F('unit_price'))
        ).order_by('-quantidade')[:5]

        top_itens_lista = [
            {
                'nome': item['saved_item_name'] or 'Item',
                'quantidade': item['quantidade'] or 0,
                'total': float(item['total_gerado'] or 0.0)
            }
            for item in top_itens
        ]

        return Response({
            'periodo': periodo,
            'faturamento_total': round(faturamento_total, 2),
            'total_pedidos': total_pedidos,
            'ticket_medio': round(ticket_medio, 2),
            'total_troco': round(total_troco, 2),
            'por_metodo_pagamento': por_metodo_pagamento,
            'serie_temporal': serie_temporal,
            'top_itens': top_itens_lista
        })
