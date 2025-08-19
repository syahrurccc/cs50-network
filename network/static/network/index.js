document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#all-posts').addEventListener('click', () => viewPosts('all'));
    if (document.body.dataset.user !== 'AnonymousUser') {
        document.querySelector('#following-posts').addEventListener('click', () => viewPosts('following'));
    }
    document.querySelector('#post-form').addEventListener('submit', newPost);
    document.querySelector('.body').addEventListener('click', (event) => {
        const author = event.target.closest('.author')
        if (author) {
            const username = author.dataset.username;
            loadProfile(username);
        }

        const followBtn = event.target.closest('.follow-btn')
        if (followBtn) {
            follows(followBtn);
        }

        const likeBtn = event.target.closest('.like-btn')
        if (likeBtn) {
            processLike(likeBtn); 
        }

        const editBtn = event.target.closest('.edit-btn');
        if (editBtn) {
            const postContainer = event.target.closest('.post-container');
            if (!postContainer) return;
            editPost(postContainer, editBtn);
        }

    });
    document.querySelector('.body').addEventListener('mouseover', (event) => {
        const followBtn = event.target.closest('.follow-btn.followed');
        if (!followBtn) return;
        followBtn.textContent = 'Unfollow';
    });
    document.querySelector('.body').addEventListener('mouseout', (event) => {
        const followBtn = event.target.closest('.follow-btn.followed');
        if (!followBtn) return;
        followBtn.textContent = 'Followed';
    });

    viewPosts('all');
});

async function viewPosts(type) {
    
    const currentUser = document.body.dataset.user;
    const isLoggedIn = currentUser !== 'AnonymousUser';
    const isAllView = type === 'all'

    document.querySelector(isAllView ? '#all-posts-view' : '#following-posts-view').innerHTML = '';
    document.querySelector('#new-post').value = '';

    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#create-post').style.display = isLoggedIn ? 'block' : 'none';
    document.querySelector('#following-posts-view').style.display = isAllView ? 'none' : 'block';
    document.querySelector('#all-posts-view').style.display = isAllView ? 'block' : 'none';
    
    try {
        const response = await fetch(`/posts/${type}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const { posts, liked_ids } = await response.json();
        const liked = new Set(liked_ids);
        console.log(posts)
        const postBody = document.querySelector( isAllView ? '#all-posts-view' : '#following-posts-view');
        loadPosts(posts, postBody, liked);

    } catch(error) {
        console.error(error)
    }
}

function newPost(event) {
    
    event.preventDefault();

    const content = document.querySelector('#new-post').value;

    fetch('/posts/create', {
        method: 'POST',
        body: JSON.stringify({content})
    })
    .then(response => response.json())
    .then(result => {
        console.log(result)
        viewPosts('all')
    })
}

async function loadProfile(username) {
    
    const currentUser = document.body.dataset.user;

    document.querySelector('#all-posts-view').innerHTML = '';
    document.querySelector('#following-posts-view').innerHTML = '';
    document.querySelector('#profile-view').innerHTML = '';

    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#create-post').style.display = 'none';
    document.querySelector('#following-posts-view').style.display = 'none';
    document.querySelector('#all-posts-view').style.display = 'none';

    try {
        const response = await fetch(`/users/${username}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const { profile, posts, isFollowing, liked_ids } = await response.json()
        const liked = new Set(liked_ids);

        const profilePage = document.createElement('div');
        profilePage.className = 'profile-page';

        const profileContainer = document.createElement('div');
        profileContainer.className = 'profile-container';

        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = profile.profile_pic;

        const handle = document.createElement('h2');
        handle.className = 'handle'
        handle.textContent = `@${username}`;

        const followsDiv = document.createElement('div');
        followsDiv.className = 'follows';

        const following = document.createElement('span');
        following.className = 'following';
        following.dataset.count = profile.followings_count;
        following.textContent = `${profile.followings_count} Following`

        const followers = document.createElement('span');
        followers.className = 'followers';
        followers.dataset.count = profile.followers_count;
        followers.textContent = `${profile.followers_count} Followers`
        
        followsDiv.append(following, followers);
        
        if (currentUser !== profile.username) {
            const followBtn = document.createElement('span');
            followBtn.classList.add('follow-btn', isFollowing ? 'followed' : 'unfollowed');
            followBtn.dataset.username = username;
            followBtn.textContent = isFollowing ? 'Followed' : 'Follow';
            followsDiv.append(followBtn);
        }

        profileContainer.append(avatar, handle, followsDiv);
        document.querySelector('#profile-view').append(profileContainer);

        const postBody = document.querySelector('#profile-view');
        loadPosts(posts, postBody, liked);

    } catch(error) {
        console.log(error);
    }
}

function loadPosts(posts, postBody, liked) {

    const currentUser = document.body.dataset.user;
        
    posts.forEach(post => {
        const postContainer = document.createElement('div');
        postContainer.className = 'post-container';
        postContainer.id = post.id

        const details = document.createElement('div');
        details.className = 'details';
        
        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = post.author_pfp;

        const username = document.createElement('span');
        username.className = 'author';
        username.dataset.username = post.author_username;
        username.textContent = post.author_username;

        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = post.timestamp;

        details.append(avatar, username, timestamp);

        const content = document.createElement('p');
        content.textContent = post.content;

        const actions = document.createElement('div');
        actions.className = 'actions';
        
        const like = document.createElement('span');
        const isLiked = liked.has(post.id)
        like.classList.add('like-btn', isLiked ? 'liked' : 'unliked');
        like.dataset.id = post.id;
        like.dataset.count = post.likes;
        like.textContent = `${post.likes} Likes`;
        actions.append(like);

        if (currentUser === post.author_username) {
            const editBtn = document.createElement('span');
            editBtn.className = 'edit-btn';
            editBtn.dataset.id = post.id;
            editBtn.textContent = 'Edit';
            actions.append(editBtn);
        }

        postContainer.append(details, content, actions);
        postBody.append(postContainer);
        
    });
}

async function follows(followBtn) {

    const wasFollowing = followBtn.classList.contains('followed');
    const username = followBtn.dataset.username;
    const followersEl = document.querySelector('.followers');

    let currentCount = parseInt(followersEl.dataset.count);
    const newCount = wasFollowing ? currentCount - 1 : currentCount + 1;
    followersEl.dataset.count = newCount;
    followersEl.textContent = `${newCount} Followers`;
    
    followBtn.classList.toggle('followed', !wasFollowing);
	followBtn.classList.toggle('unfollowed', wasFollowing);
	
    let label;
    // If the user was following now they're not, so display 'follow'
    if (wasFollowing) {
        label = 'Follow'
    } else {
        // If they're following and still hovering on the button, display unfollow, else follow
        label = followBtn.matches(':hover') ? 'Unfollow' : 'Follow';
    }

    followBtn.textContent = label;

    try {
        const response = await fetch(`/users/follow/${username}`, {
            method: 'PUT',
            body: JSON.stringify({"following": !wasFollowing})
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.redirect) {
                window.location.href = result.redirect;
            }
            throw new Error(result.error);
        }

    } catch(error) {
        console.error(error);
    }
        
}

async function processLike(likeBtn) {

    const isLiked = likeBtn.classList.contains('liked');
    let currentCount = parseInt(likeBtn.dataset.count);

    const newCount = isLiked ? currentCount - 1 : currentCount + 1;
    likeBtn.dataset.count = newCount;
    likeBtn.textContent = `${newCount} Likes`;

    likeBtn.classList.toggle('liked', !isLiked);
    likeBtn.classList.toggle('unliked', isLiked);

    try {
        const response = await fetch(`/posts/like/${likeBtn.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({"liked": !isLiked})
        });

        const result = await response.json();
        
        if (!response.ok) {
            if (result.redirect) {
                window.location.href = result.redirect;
            }
            throw new Error(result.error);
        }

    } catch(error) {

    }
}

function editPost(postContainer, editBtn) {

    const contentEl = postContainer.querySelector('p');
    const oldText = contentEl.textContent;

    const textarea = document.createElement('textarea');
    textarea.className = 'edit-box';
    textarea.value = oldText;

    const saveEditBtn = document.createElement('span');
    saveEditBtn.textContent = 'Save Edit';
    saveEditBtn.className = 'save-edit-btn';

    contentEl.replaceWith(textarea);
    editBtn.replaceWith(saveEditBtn);

    saveEditBtn.onclick = async () => {
        const newText = textarea.value;

        const response = await fetch(`/posts/edit/${postContainer.id}`, {
            method: 'PUT',
            body: JSON.stringify({"content": newText})
        });
        const result = await response.json();
        console.log(result);
        
        const newP = document.createElement('p');
        newP.textContent = newText;

        saveEditBtn.replaceWith(editBtn);
        textarea.replaceWith(newP);
        editBtn.onclick = () => editPost(postContainer, editBtn);
    };
}