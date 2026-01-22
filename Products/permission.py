from rest_framework.permissions import BasePermission
class IsSeller(BasePermission):
    def has_permission(self, request, view):
        user=request.user
        if user.is_authenticated and user.role=='seller':
            return True
        return False




class IsSellerorAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user=request.user
        if user.is_authenticated and user.role=='admin':
            return True
        if user.role=='seller' and obj.created_by==user:
            return True  

        return False

    