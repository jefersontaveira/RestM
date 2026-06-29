from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nome")

    def __str__(self):
        return self.name

class Item(models.Model):
    category = models.ForeignKey(Category, related_name='items', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, verbose_name="Nome")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    image = models.ImageField(upload_to='items_images/', blank=True, null=True, verbose_name="Foto")

    def __str__(self):
        return self.name

class Table(models.Model):
    STATUS_CHOICES = (
        ('livre', 'Livre'),
        ('ocupada', 'Ocupada'),
    )
    identification = models.CharField(max_length=50, unique=True, verbose_name="Nome ou Número")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='livre')

    def __str__(self):
        return self.identification

class Order(models.Model):
    STATUS_CHOICES = (
        ('aberto', 'Aberto'),
        ('finalizado', 'Finalizado'),
    )
    table = models.ForeignKey(Table, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    saved_table_name = models.CharField(max_length=100, null=True, blank=True)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='aberto')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data/Hora de Abertura")
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name="Data/Hora de Fechamento")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Total")
    change = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        if self.table and not self.saved_table_name:
            self.saved_table_name = self.table.identification
        super().save(*args, **kwargs)

    def __str__(self):
        nome_mesa = self.table.identification if self.table else "Deletada"
        return f"Pedido {self.id} - Mesa {nome_mesa}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    saved_item_name = models.CharField(max_length=255, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço Unitário na Venda")

    def save(self, *args, **kwargs):
        if self.item:
            if not self.saved_item_name:
                self.saved_item_name = self.item.name
            if not self.unit_price:
                self.unit_price = self.item.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.item.name}"
