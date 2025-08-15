import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post


def index(request):

    return render(request, "network/index.html")

@csrf_exempt
@login_required
def create_posts(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    elif not request.user.is_authenticated:
        return JsonResponse({"error": "Not logged in."}, status=401)
    
    data = json.loads(request.body)

    if content := data.get("content"):
        Post.objects.create(author=request.user, content=content)
        return JsonResponse({"message": "Post created."})
    
    return JsonResponse({"error": "Content can't be empty."})


def show_posts(request, type):

    if type == "all":
        posts = Post.objects.order_by("-timestamp").all()
    elif type == "following":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not logged in."}, status=401)
        posts = Post.objects.filter(author__followers=request.user).order_by("-timestamp")
    else:
        return JsonResponse({"error": "Invalid route"}, status=400)
    
    liked_ids = set()
    if request.user.is_authenticated:
        liked_ids = set(request.user.likes.values_list("id", flat=True))

    return JsonResponse({"posts": [post.serialize() for post in posts], "liked_ids": list(liked_ids)})


def profile(request, username):
    
    try:
        profile = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User does not exist"}, status=404)
    
    posts = Post.objects.filter(author=profile)

    if request.method == "GET":
        return JsonResponse({
            "profile": profile.serialize(),
            "posts": [post.serialize() for post in posts]
        })

    elif request.method == "PUT":
        data = json.loads(request.body)
        if profile != request.user and data.get("following") is not None:
            profile.followers.add(request.user)
        profile.save()
        return HttpResponse(status=204)

    else:
        return JsonResponse({"error": "GET or PUT request required."}, status=400)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
