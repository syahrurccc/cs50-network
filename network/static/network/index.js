document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#all-posts').addEventListener('click', () => loadPosts('all'));
    document.querySelector('#following-posts').addEventListener('click', () => loadPosts('following'));
    document.querySelector('#post-form').addEventListener('submit', newPost);
    document.querySelector('body').addEventListener('click', (event) => {
        const profile = event.target.closest('.profile')
        if (profile) {
            show_profile(profile)
        }
    });

    loadPosts('all');
});

async function loadPosts(type) {
    
    const currentUser = document.body.dataset.user;
    const isLoggedIn = currentUser !== 'AnonymousUser';
    const isAllView = type === 'all'

    document.querySelector(type === 'all' ? '#all-posts-view' : '#following-posts-view').innerHTML = '';
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

        posts.forEach(post => {
            const container = document.createElement('div');
            container.className = 'post';
            container.id = post.id

            const details = document.createElement('div');
            details.className = 'details';
            
            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            avatar.src = post.author_pfp;

            const username = document.createElement('span');
            username.className = 'author';
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
            like.className = liked.has(post.id) ? 'Unlike' : 'Like';
            like.textContent = liked.has(post.id) ? 'Unlike' : 'Like';

            container.append(details, content, like);
            
            document.querySelector(isAllView ? '#all-posts-view' : '#following-posts-view').append(container);
        });

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
        loadPosts('all')
    })
}