from rest_framework import serializers
from .models import Category, Item, Table, Order, OrderItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    # Traz os detalhes do item no momento de listar
    item_details = ItemSerializer(source='item', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id','order', 'item', 'item_details', 'quantity', 'unit_price']


class OrderSerializer(serializers.ModelSerializer):
    # Mantemos o table_details para a leitura rica (objeto completo) no React
    table_details = TableSerializer(source='table', read_only=True)

    # Declaramos o items de forma explícita como read_only para não travar o POST de abertura
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'table',
            'table_details',
            'saved_table_name',
            'customer_name',
            'status',
            'created_at',
            'closed_at',
            'total',
            'items',
            'change'
        ]