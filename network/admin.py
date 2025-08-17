from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Post

# Register your models here.
class CustomUserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Extra info", {"fields": ("profile_pic", "followers", "likes")}),
    )
admin.site.register(User, CustomUserAdmin)
admin.site.register(Post)