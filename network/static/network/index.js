document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#all-posts').addEventListener('click', () => viewPosts('all'));
    if (document.body.dataset.user !== 'AnonymousUser') {
        document.querySelector('#following-posts').addEventListener('click', () => viewPosts('following'));
    }
    document.querySelector('#post-form').addEventListener('submit', newPost);
    document.querySelector('.body').addEventListener('click', (event) => {
        const author = event.target.closest('.author')
        if (author) {
            const username = author.dataset.username
            loadProfile(username)
        }
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
        loadPosts(posts, type, liked);

        // posts.forEach(post => {
        //     const postContainer = document.createElement('div');
        //     postContainer.className = 'post-container';
        //     postContainer.id = post.id

        //     const details = document.createElement('div');
        //     details.className = 'details';
            
        //     const avatar = document.createElement('img');
        //     avatar.className = 'avatar';
        //     avatar.src = post.author_pfp;

        //     const username = document.createElement('span');
        //     username.className = 'author';
        //     username.id = post.author_username;
        //     username.textContent = post.author_username;

        //     const timestamp = document.createElement('span');
        //     timestamp.className = 'timestamp';
        //     timestamp.textContent = post.timestamp;

        //     details.append(avatar, username, timestamp);

        //     const content = document.createElement('p');
        //     content.textContent = post.content;

        //     const actions = document.createElement('div');
        //     actions.className = 'actions';
            
        //     const like = document.createElement('div');
        //     const isLiked = liked.has(post.id)
        //     like.className = isLiked ? 'unliked' : 'liked';
        //     like.textContent = `${post.likes} Likes`;

        //     postContainer.append(details, content, like);
            
        //     document.querySelector(isAllView ? '#all-posts-view' : '#following-posts-view').append(container);
        // });

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
        avatar.src = profile.profile_pic

        const followsDiv = document.createElement('div');
        followsDiv.className = 'follows';

        const following = document.createElement('span');
        following.textContent = `${profile.followings_count} Following`

        const followers = document.createElement('span');
        followers.textContent = `${profile.followers_count} Followers`
        
        followsDiv.append(following, followers);

        if (currentUser !== profile.username) {
            const followBtn = document.createElement('span');
            followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
            followsDiv.append(followBtn);
        }

        profileContainer.append(avatar, followsDiv);
        document.querySelector('#profile-view').append(profileContainer);

        loadPosts(posts, 'profile', liked); 

    } catch(error) {
        console.log(error)
    }

}

function loadPosts(posts, type, liked) {

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
        
        const like = document.createElement('div');
        const isLiked = liked.has(post.id)
        like.className = isLiked ? 'liked' : 'unliked';
        like.textContent = `${post.likes} Likes`;

        postContainer.append(details, content, like);
        
        switch (type) {
            case 'all':
                document.querySelector('#all-posts-view').append(postContainer);
                break;
            case 'following':
                document.querySelector('#following-posts-view').append(postContainer);
                break;
            case 'profile':
                document.querySelector('#profile-view').append(postContainer);
                break;
        }
    });
}