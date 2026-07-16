
let allPosts = [];
const discussionList = document.querySelector('.discussion-list');
const postForm = document.getElementById('postForm');
const searchInput = document.querySelector('.search-input');
const threadModal = document.getElementById('threadModal');
const threadContent = document.getElementById('threadContent');

document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();
});

async function fetchPosts() {
    try {
        const res = await fetch('/api/posts');
        allPosts = await res.json();
        renderPosts(allPosts);
    } catch (err) {
        console.error('Failed to fetch posts:', err);
        discussionList.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Failed to load discussions. Is the server running?</p>';
    }
}

function renderPosts(posts) {
    discussionList.innerHTML = '';
    if (posts.length === 0) {
        discussionList.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No discussions found. Start one!</p>';
        return;
    }

    posts.forEach(post => {
        const timeAgo = getTimeAgo(post.createdAt);
        const replyCount = post.replies ? post.replies.length : 0;
        const badge = (post.category === 'tech' || post.category === 'privacy') ? '<span class="badge hot">HOT</span>' : '';

        const item = document.createElement('div');
        item.className = 'discussion-item';
        item.dataset.category = post.category;
        item.innerHTML = `
            <div class="discussion-header">
                <a href="#" class="discussion-title" data-id="${post.id}">
                    ${post.title} ${badge}
                </a>
            </div>
            <div class="discussion-meta">
                <span class="meta-item"><span class="anonymous-tag">👤 Anonymous</span></span>
                <span class="meta-item"> ${timeAgo}</span>
                <span class="meta-item">💬 ${replyCount} replies</span>
                <span class="meta-item">👁 ${post.views || 0} views</span>
            </div>
            <div class="discussion-preview">${post.content.substring(0, 150)}...</div>
        `;
        discussionList.appendChild(item);
    });

    document.querySelectorAll('.discussion-title').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openThread(this.dataset.id);
        });
    });
}

async function openThread(postId) {
    try {
        const res = await fetch(`/api/posts/${postId}`);
        const post = await res.json();
        
        let repliesHtml = '';
        if (post.replies && post.replies.length > 0) {
            repliesHtml = post.replies.map(r => `
                <div class="reply-item">
                    <div class="reply-meta">
                        <span class="anonymous-tag">👤 Anonymous</span>
                        <span>• ${getTimeAgo(r.createdAt)}</span>
                    </div>
                    <p>${r.content}</p>
                </div>
            `).join('');
        } else {
            repliesHtml = '<p style="color:var(--text-secondary); text-align:center;">No replies yet. Be the first to respond!</p>';
        }

        threadContent.innerHTML = `
            <h2 style="margin-bottom: 1rem;">${post.title}</h2>
            <div class="discussion-meta" style="margin-bottom: 1.5rem;">
                <span class="anonymous-tag">👤 Anonymous</span>
                <span>• ${getTimeAgo(post.createdAt)}</span>
                <span>• 👁 ${post.views} views</span>
            </div>
            <p style="margin-bottom: 2rem; white-space: pre-wrap; color: var(--text-secondary);">${post.content}</p>
            <h3 style="margin-bottom: 1rem; font-size: 1.2rem;">Replies (${post.replies.length})</h3>
            <div class="replies-list">${repliesHtml}</div>
            <form id="replyForm" style="margin-top: 1.5rem;">
                <textarea class="modal-textarea" placeholder="Write an anonymous reply..." rows="3" required></textarea>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">Post Reply</button>
            </form>
        `;

        threadModal.classList.add('active');

        document.getElementById('replyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const textarea = e.target.querySelector('textarea');
            const content = textarea.value.trim();
            if (!content) return;

            const res = await fetch(`/api/posts/${postId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                showToast('✅ Reply posted anonymously!');
                textarea.value = '';
                openThread(postId);
                fetchPosts();
            }
        });

    } catch (err) {
        console.error('Failed to open thread:', err);
        showToast('❌ Failed to load thread.');
    }
}

postForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = this.querySelector('input[type="text"]').value;
    const category = this.querySelector('#postCategory').value;
    const content = this.querySelector('textarea').value;

    try {
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, category })
        });

        if (res.ok) {
            closePostModal();
            showToast('✅ Post published anonymously!');
            this.reset();
            fetchPosts();
        } else {
            showToast('❌ Failed to publish post.');
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Server error.');
    }
});

document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', function() {
        const category = this.dataset.category;
        window.location.href = `/category?c=${category}`;
    });
});

if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        const filtered = allPosts.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.content.toLowerCase().includes(query)
        );
        renderPosts(filtered);
    });
}

function openPostModal() {
    document.getElementById('postModal').classList.add('active');
}

function closePostModal() {
    document.getElementById('postModal').classList.remove('active');
}

function closeThreadModal() {
    document.getElementById('threadModal').classList.remove('active');
}

window.onclick = function(event) {
    if (event.target == document.getElementById('postModal')) closePostModal();
    if (event.target == document.getElementById('threadModal')) closeThreadModal();
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.querySelector('.nav-links').classList.remove('active');
            }
        }
    });
});

function scrollToDiscussion() {
    document.getElementById('discussions').scrollIntoView({ behavior: 'smooth' });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function getTimeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

document.querySelectorAll('.discussion-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.borderColor = 'var(--primary-purple)';
    });
    item.addEventListener('mouseleave', function() {
        this.style.borderColor = 'var(--border-color)';
    });
});