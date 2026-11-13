from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ItemViewSet,
    TableViewSet,
    OrderViewSet,
    OrderItemViewSet,
    TenantSettingsView,
    PublicCardapioView,
    RelatoriosView,
    UserProfileView,
    CustomAuthToken
)

router = DefaultRouter()
router.register(r'categorias', CategoryViewSet)
router.register(r'itens', ItemViewSet)
router.register(r'mesas', TableViewSet)
router.register(r'pedidos', OrderViewSet)
router.register(r'itens-pedido', OrderItemViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/configuracoes/', TenantSettingsView.as_view(), name='tenant-settings'),
    path('api/cardapio/<str:slug>/', PublicCardapioView.as_view(), name='public-cardapio'),
    path('api/relatorios/', RelatoriosView.as_view(), name='relatorios'),
    path('api/me/', UserProfileView.as_view(), name='user-me'),
    path('api/token/', CustomAuthToken.as_view(), name='api-token'),
]
