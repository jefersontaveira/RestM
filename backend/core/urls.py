from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, TableViewSet, OrderViewSet, OrderItemViewSet

router = DefaultRouter()
router.register(r'categorias', CategoryViewSet)
router.register(r'itens', ItemViewSet)
router.register(r'mesas', TableViewSet)
router.register(r'pedidos', OrderViewSet)
router.register(r'itens-pedido', OrderItemViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]