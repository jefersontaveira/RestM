from django.contrib import admin
from .models import Tenant, UserProfile, Category, Item, Table, Order, OrderItem

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'phone', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'tenant', 'role')
    list_filter = ('role', 'tenant')
    search_fields = ('user__username', 'tenant__name')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant')
    list_filter = ('tenant',)
    search_fields = ('name',)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available', 'tenant')
    list_filter = ('tenant', 'category', 'is_available')
    search_fields = ('name',)

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('identification', 'status', 'tenant')
    list_filter = ('tenant', 'status')
    search_fields = ('identification',)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant', 'table', 'customer_name', 'status', 'payment_method', 'total', 'created_at', 'closed_at')
    list_filter = ('tenant', 'status', 'payment_method', 'created_at')
    search_fields = ('table__identification', 'customer_name', 'saved_table_name')
    inlines = [OrderItemInline]
