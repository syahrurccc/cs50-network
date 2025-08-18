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
    });
    document.querySelector('.body').addEventListener('mouseover', (event) => {
        const followBtn = event.target.closest('.follow-btn.followed')
        if (!followBtn) return;
        followBtn.textContent = 'Unfollow';
    });
    document.querySelector('.body').addEventListener('mouseout', (event) => {
        const followBtn = event.target.closest('.follow-btn.followed')
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
        following.textContent = `${profile.followings_count} Following`

        const followers = document.createElement('span');
        followers.className = 'followers';
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
        
        // TODO: FIX LIKE BUTTON ID
        const like = document.createElement('div');
        const isLiked = liked.has(post.id)
        like.classList.add('like-btn', isLiked ? 'liked' : 'unliked');
        like.textContent = `${post.likes} Likes`;

        postContainer.append(details, content, like);
        postBody.append(postContainer);
        
    });
}

function follows(followBtn) {

    const isFollowing = followBtn.classList.contains('followed');
    const username = followBtn.dataset.username;

    // TODO: FIX THIS
    let followers = document.querySelector('followers').textContent;
    let followersCount = Number(followers.charAt(0));
    followers.textContent = `${isFollowing ? followersCount-- : followersCount++} Followers`

    followBtn.classList.toggle('followed', !isFollowing);
	followBtn.classList.toggle('unfollowed', isFollowing);
	
	followBtn.textContent = isFollowing ? 'Follow':'Followed';

	fetch(`/users/follow/${username}`, {
		method: 'PUT',
		body: JSON.stringify({"following": !isFollowing})
	});
}