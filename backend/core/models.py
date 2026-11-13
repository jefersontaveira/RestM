from django.db import models
from django.contrib.auth.models import User

def default_operating_hours():
    return {
        "seg": {"aberto": True, "inicio": "11:00", "fim": "23:00"},
        "ter": {"aberto": True, "inicio": "11:00", "fim": "23:00"},
        "qua": {"aberto": True, "inicio": "11:00", "fim": "23:00"},
        "qui": {"aberto": True, "inicio": "11:00", "fim": "23:00"},
        "sex": {"aberto": True, "inicio": "11:00", "fim": "23:59"},
        "sab": {"aberto": True, "inicio": "11:00", "fim": "23:59"},
        "dom": {"aberto": False, "inicio": "11:00", "fim": "22:00"}
    }

class Tenant(models.Model):
    name = models.CharField(max_length=150, verbose_name="Nome do Restaurante")
    slug = models.SlugField(max_length=150, unique=True, verbose_name="Slug para Cardápio")
    logo = models.ImageField(upload_to='tenant_logos/', blank=True, null=True, verbose_name="Logotipo")
    primary_color = models.CharField(max_length=20, default="#F59E0B", verbose_name="Cor Primária")
    secondary_color = models.CharField(max_length=20, default="#1E1E1E", verbose_name="Cor Secundária")
    phone = models.CharField(max_length=30, blank=True, null=True, verbose_name="Telefone / WhatsApp")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Endereço")
    address_details = models.JSONField(default=dict, blank=True, verbose_name="Detalhes Estruturados do Endereço")
    operating_hours = models.JSONField(default=default_operating_hours, blank=True, verbose_name="Horários de Funcionamento")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Estabelecimento"
        verbose_name_plural = "Estabelecimentos"

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('operador', 'Operador'),
    )
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, related_name='users', on_delete=models.CASCADE, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')

    class Meta:
        verbose_name = "Perfil de Usuário"
        verbose_name_plural = "Perfis de Usuários"

    def __str__(self):
        tenant_name = self.tenant.name if self.tenant else "Sem Estabelecimento"
        return f"{self.user.username} ({tenant_name})"

class Category(models.Model):
    tenant = models.ForeignKey(Tenant, related_name='categories', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100, verbose_name="Nome")

    class Meta:
        unique_together = ('tenant', 'name')
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"

    def __str__(self):
        return self.name

class Item(models.Model):
    tenant = models.ForeignKey(Tenant, related_name='items', on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(Category, related_name='items', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, verbose_name="Nome")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    image = models.ImageField(upload_to='items_images/', blank=True, null=True, verbose_name="Foto")
    is_available = models.BooleanField(default=True, verbose_name="Disponível no Cardápio")

    class Meta:
        verbose_name = "Item do Cardápio"
        verbose_name_plural = "Itens do Cardápio"

    def __str__(self):
        return self.name

class Table(models.Model):
    STATUS_CHOICES = (
        ('livre', 'Livre'),
        ('ocupada', 'Ocupada'),
    )
    tenant = models.ForeignKey(Tenant, related_name='tables', on_delete=models.CASCADE, null=True, blank=True)
    identification = models.CharField(max_length=50, verbose_name="Nome ou Número")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='livre')

    class Meta:
        unique_together = ('tenant', 'identification')
        verbose_name = "Mesa"
        verbose_name_plural = "Mesas"

    def __str__(self):
        return self.identification

class Order(models.Model):
    STATUS_CHOICES = (
        ('aberto', 'Aberto'),
        ('finalizado', 'Finalizado'),
    )
    PAYMENT_CHOICES = (
        ('dinheiro', 'Dinheiro'),
        ('pix', 'PIX'),
        ('credito', 'Cartão de Crédito'),
        ('debito', 'Cartão de Débito'),
        ('outro', 'Outro'),
    )
    tenant = models.ForeignKey(Tenant, related_name='orders', on_delete=models.CASCADE, null=True, blank=True)
    table = models.ForeignKey(Table, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    saved_table_name = models.CharField(max_length=100, null=True, blank=True, verbose_name="Nome da Mesa Congelado")
    customer_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nome do Cliente")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='aberto', verbose_name="Status")
    payment_method = models.CharField(max_length=30, choices=PAYMENT_CHOICES, blank=True, null=True, verbose_name="Método de Pagamento")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data/Hora de Abertura")
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name="Data/Hora de Fechamento")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Total")
    change = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Troco")

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    def save(self, *args, **kwargs):
        # Blindagem: se a mesa existe e ainda não temos saved_table_name, salva
        if self.table and not self.saved_table_name:
            self.saved_table_name = self.table.identification
        super().save(*args, **kwargs)

    def __str__(self):
        nome_mesa = self.saved_table_name or (self.table.identification if self.table else "Deletada")
        return f"Pedido {self.id} - Mesa {nome_mesa}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True)
    saved_item_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Nome do Item Congelado")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantidade")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço Unitário na Venda")

    class Meta:
        verbose_name = "Item do Pedido"
        verbose_name_plural = "Itens do Pedido"

    def save(self, *args, **kwargs):
        if self.item:
            if not self.saved_item_name:
                self.saved_item_name = self.item.name
            if not self.unit_price:
                self.unit_price = self.item.price
        super().save(*args, **kwargs)

    def __str__(self):
        nome = self.saved_item_name or (self.item.name if self.item else "Item")
        return f"{self.quantity}x {nome}"
