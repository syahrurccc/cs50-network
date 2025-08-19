
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API paths
    path("posts/create", views.create_posts, name="create_posts"),
    path("posts/<str:type>", views.load_posts, name="show_posts"),
    path("posts/edit/<int:post_id>", views.edit_post, name="edit_posts"),
    path("posts/like/<int:post_id>", views.like_post, name="like_posts"),
    path("users/<str:username>", views.profile, name="profile"),
    path("users/follow/<str:username>", views.profile, name="follows")
]
