from rest_framework import viewsets
from django.db.models import Q
from .models import Category, Item, Table, Order, OrderItem
from .serializers import CategorySerializer, ItemSerializer, TableSerializer, OrderSerializer, OrderItemSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        queryset = Order.objects.all()

        # 1. Filtros básicos vindo da URL
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if status:
            queryset = queryset.filter(status=status)

        if search:
            # Busca inteligente: filtra se o nome do cliente CONTÉM o termo
            # OU se a identificação da mesa CONTÉM o termo
            queryset = queryset.filter(
                Q(customer_name__icontains=search) |
                Q(table__identification__icontains=search)
            )

        # Ordena sempre pelos mais recentes finalizados
        queryset = queryset.order_by('-closed_at')

        # 2. Paginação manual por Query Params (Apenas na listagem para não quebrar o PATCH/DELETE)
        if self.action == 'list':
            limit = self.request.query_params.get('limit')
            offset = self.request.query_params.get('offset')
            if limit:
                start = int(offset) if offset else 0
                end = start + int(limit)
                return queryset[start:end]

        return queryset

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer