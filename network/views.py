import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post


def index(request):

    return render(request, "network/index.html")


@csrf_exempt
@login_required(login_url="/login")
def create_posts(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    elif not request.user.is_authenticated:
        return JsonResponse({"error": "Not logged in."}, status=401)
    
    data = json.loads(request.body)

    if content := data.get("content"):
        Post.objects.create(author=request.user, content=content)
        return JsonResponse({"message": "Post created."}, status=201)
    
    return JsonResponse({"error": "Content can't be empty."}, status=400)


def load_posts(request, type):

    if type == "all":
        posts = Post.objects.order_by("-timestamp").all()
    elif type == "following":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not logged in."}, status=401)
        posts = Post.objects.filter(author__followers=request.user).order_by("-timestamp")
    
    else:
        return JsonResponse({"error": "Invalid route"}, status=400)
    
    liked_ids = set(request.user.likes.values_list("id", flat=True)) if request.user.is_authenticated else set()

    return JsonResponse({
        "posts": [post.serialize() for post in posts], 
        "liked_ids": list(liked_ids)
    })

@csrf_exempt
def edit_post(request, post_id):

    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)
    
    post = Post.objects.get(id=post_id)

    if request.user != post.author:
        return JsonResponse({"error": "Can't edit other user's post."}, status=403)
    
    data = json.loads(request.body)

    if new_content := data.get("content"):
        post.content = new_content
        post.save()
        return JsonResponse({"message": "Post edited."}, status=201)

    return JsonResponse({"error": "Content can't be empty."}, status=400)

@csrf_exempt
def like_post(request, post_id):

    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)
    elif not request.user.is_authenticated:
        return JsonResponse({"error": "Not logged in", "redirect":"/login"}, status=401)
    
    post = Post.objects.get(id=post_id)
    data = json.loads(request.body)

    if data.get("liked"):
        request.user.likes.add(post)
        return JsonResponse({"message": "Post liked."}, status=200)
    else:
        request.user.likes.remove(post)
        return JsonResponse({"message": "Post unliked."}, status=200)

    

@csrf_exempt
def profile(request, username):
    
    try:
        profile = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User does not exist"}, status=404)
    
    posts = Post.objects.filter(author=profile).order_by("-timestamp")
    liked_ids = set(request.user.likes.values_list("id", flat=True)) if request.user.is_authenticated else set()

    # Check if the current user is following the viewed user
    is_following = False
    if request.user.is_authenticated:
        is_following = request.user.followings.filter(id=profile.id).exists()

    if request.method == "GET":
        return JsonResponse({
            "profile": profile.serialize(),
            "posts": [post.serialize() for post in posts],
            "isFollowing": is_following,
            "liked_ids": list(liked_ids)
        })

    # If user click follow button
    elif request.method == "PUT":

        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated.", "redirect":"/login"}, status=401)
        elif profile == request.user:
            return JsonResponse({"error": "Can't follow yourself, Mate."}, status=400)
        
        data = json.loads(request.body)
        
        if data.get("following"):
            profile.followers.add(request.user)
            return JsonResponse({"message": "User followed."}, status=200)
        else:
            profile.followers.remove(request.user)
            return JsonResponse({"message": "User unfollowed."}, status=200)
        
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
