from django.contrib import admin
from .models import Category, Item, Table, Order, OrderItem

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('identification', 'status')
    list_filter = ('status',)
    search_fields = ('identification',)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'table', 'customer_name', 'status', 'total', 'created_at', 'closed_at')
    list_filter = ('status', 'created_at')
    search_fields = ('table__identification',)
    inlines = [OrderItemInline]