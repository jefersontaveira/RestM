import json
from django.utils.text import slugify
from rest_framework import serializers
from .models import Tenant, UserProfile, Category, Item, Table, Order, OrderItem

class TenantSerializer(serializers.ModelSerializer):
    operating_hours = serializers.JSONField(required=False)
    address_details = serializers.JSONField(required=False)

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'logo', 'primary_color', 'secondary_color',
            'phone', 'address', 'address_details', 'operating_hours', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def validate_operating_hours(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                raise serializers.ValidationError("Formato de JSON inválido para horários.")
        return value

    def validate_address_details(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                raise serializers.ValidationError("Formato de JSON inválido para detalhes do endereço.")
        return value

    def validate(self, attrs):
        # Auto-configurar o slug a partir do nome definido
        if 'name' in attrs:
            base_slug = slugify(attrs['name'])
            if not base_slug:
                base_slug = 'restaurante'

            slug = base_slug
            counter = 1
            tenant_id = self.instance.id if self.instance else None
            while Tenant.objects.filter(slug=slug).exclude(id=tenant_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs['slug'] = slug

        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'role', 'tenant']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'tenant']
        read_only_fields = ['tenant']

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'price', 'image', 'is_available', 'category', 'category_name', 'tenant']
        read_only_fields = ['tenant']

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'identification', 'status', 'tenant']
        read_only_fields = ['tenant']

class OrderItemSerializer(serializers.ModelSerializer):
    item_details = ItemSerializer(source='item', read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'item', 'item_details', 'saved_item_name', 'quantity', 'unit_price']

class OrderSerializer(serializers.ModelSerializer):
    table_details = TableSerializer(source='table', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'tenant',
            'table',
            'table_details',
            'saved_table_name',
            'customer_name',
            'status',
            'payment_method',
            'created_at',
            'closed_at',
            'total',
            'change',
            'items'
        ]
        read_only_fields = ['tenant', 'created_at']

# Serializers públicos para o Cardápio
class PublicItemSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'price', 'image', 'is_available']

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class PublicCategorySerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'items']

    def get_items(self, obj):
        available_items = obj.items.filter(is_available=True)
        return PublicItemSerializer(available_items, many=True, context=self.context).data
