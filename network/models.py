from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical=False, related_name='followings', blank=True)
    likes = models.ManyToManyField('Post', related_name='liked_by', blank=True)
    profile_pic = models.URLField(blank=True, default="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg")

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "profile_pic": self.profile_pic,
            "followers_count": self.followers.count(),
            "followings_count": self.followings.count()
        }


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "author_id": self.author_id,
            "author_username": self.author.username,
            "author_pfp": self.author.profile_pic,
            "content": self.content,
            "likes": self.liked_by.count(),
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }