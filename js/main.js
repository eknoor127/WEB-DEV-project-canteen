/* ============================================
   SGGSCC CANTEEN - Main JavaScript
   ============================================ */

// ==================== CART STATE ====================
let cart = JSON.parse(localStorage.getItem('sggscc_cart')) || [];
let selectedTime = '';
let selectedPayment = 'counter';
let breakModeActive = false;

// ==================== PRELOADER ====================
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('hidden'), 1200);
    }
    updateCartUI();
    initScrollAnimations();
    initProjectModal();
    updateDailySpecial();
    startCutoffTimer();
});

// ==================== PROJECT MODAL ====================
function initProjectModal() {
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('projectModalClose');

    if (!modal || !closeBtn) return;

    const toggleModal = (show) => {
        modal.classList.toggle('active', show);
        modal.setAttribute('aria-hidden', show ? 'false' : 'true');
        document.body.classList.toggle('modal-open', show);
    };

    closeBtn.addEventListener('click', () => toggleModal(false));
    modal.addEventListener('click', (event) => {
        if (event.target === modal) toggleModal(false);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            toggleModal(false);
        }
    });

    toggleModal(true);
}

// ==================== NAVBAR ====================
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

document.addEventListener('click', (e) => {
    if (navLinks && hamburger && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

window.addEventListener('scroll', () => {
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    }
});

// ==================== SCROLL REVEAL ANIMATIONS ====================
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, emoji = '✅') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastEmoji = toast?.querySelector('.toast-emoji');
    if (!toast) return;

    if (toastEmoji) toastEmoji.textContent = emoji;
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== CART FUNCTIONS ====================
function addToCart(name, price, emoji, btnEl) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name, price, emoji, qty: 1 });
    }
    saveCart();
    updateCartUI();

    if (btnEl) {
        btnEl.classList.add('added');
        btnEl.textContent = '✓';
        setTimeout(() => {
            btnEl.classList.remove('added');
            btnEl.textContent = '+';
        }, 1500);
    }

    showToast(`${emoji} ${name} added to cart!`, '🛒');
}

function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    saveCart();
    updateCartUI();
}

function updateQty(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(name);
        return;
    }
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('sggscc_cart', JSON.stringify(cart));
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const totalPrice = document.getElementById('totalPrice');
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <span class="empty-emoji">🍽️</span>
                <p>Your cart is empty!</p>
                <a href="menu.html" style="color: var(--primary); font-weight: 600; text-decoration: none;">Browse Menu →</a>
            </div>`;
        if (cartTotal) cartTotal.style.display = 'none';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <span class="emoji">${item.emoji}</span>
                <div>
                    <div class="name">${item.name}</div>
                    <div class="qty">₹${item.price} each</div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty('${item.name}', -1)">−</button>
                    <span style="font-weight:600; min-width:20px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.name}', 1)">+</button>
                </div>
                <span class="item-price">₹${item.price * item.qty}</span>
            </div>
        </div>
    `).join('');

    if (cartTotal) {
        cartTotal.style.display = 'flex';
        totalPrice.textContent = `₹${getCartTotal()}`;
    }
}

// ==================== QUICK REORDER ====================
function quickReorder(name, price, emoji) {
    addToCart(name, price, emoji, null);
    showToast(`${emoji} ${name} added from last order!`, '🔄');
}

// ==================== MENU SEARCH & FILTER ====================
function filterCategory(category, btnEl) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(card => {
        const match = category === 'all' || card.dataset.category === category;
        const searchMatch = !currentSearch || card.dataset.name.toLowerCase().includes(currentSearch);
        const breakMatch = !breakModeActive || parseInt(card.dataset.prep) <= 8;
        card.classList.toggle('hidden-card', !(match && searchMatch && breakMatch));
    });
}

let currentSearch = '';
const menuSearch = document.getElementById('menuSearch');
if (menuSearch) {
    menuSearch.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        const activeCategory = document.querySelector('.category-btn.active');
        const category = activeCategory ? activeCategory.dataset.category : 'all';
        filterCategory(category, activeCategory);
    });
}

// ==================== 15-MIN BREAK MODE ====================
function toggleBreakMode() {
    const toggle = document.getElementById('breakModeToggle');
    if (!toggle) return;
    breakModeActive = !breakModeActive;
    toggle.classList.toggle('active', breakModeActive);

    const activeCategory = document.querySelector('.category-btn.active');
    const category = activeCategory ? activeCategory.dataset.category : 'all';
    filterCategory(category, activeCategory);

    if (breakModeActive) {
        showToast('Break Mode ON — showing quick items only!', '⚡');
    } else {
        showToast('Break Mode OFF — showing all items', '🍽️');
    }
}

// ==================== ORDER PAGE ====================

// Location dropdown — show table number field
const orderLocation = document.getElementById('orderLocation');
if (orderLocation) {
    orderLocation.addEventListener('change', () => {
        const tableGroup = document.getElementById('tableNumberGroup');
        if (tableGroup) {
            tableGroup.style.display = orderLocation.value === 'table' ? 'block' : 'none';
        }
    });
}

function selectTime(el) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    selectedTime = el.textContent.trim();
}

function selectPayment(el) {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedPayment = el.dataset.method;
}

function applyCoupon() {
    const code = document.getElementById('couponCode');
    if (!code) return;
    const val = code.value.trim().toUpperCase();

    if (val === 'SGGSCC50') {
        const discountDiv = document.getElementById('cartDiscount');
        const discountAmt = document.getElementById('discountAmount');
        if (discountDiv) {
            discountDiv.style.display = 'block';
            discountAmt.textContent = '10';
        }
        showToast('Coupon applied! Free Samosa on us!', '🎉');
    } else if (val === '') {
        showToast('Please enter a coupon code', '⚠️');
    } else {
        showToast('Invalid coupon code. Try SGGSCC50!', '❌');
    }
}

function placeOrder() {
    const name = document.getElementById('orderName')?.value.trim();
    const studentId = document.getElementById('orderStudentId')?.value.trim();

    if (!name) {
        showToast('Please enter your name', '⚠️');
        return;
    }
    if (!studentId) {
        showToast('Please enter your Student ID', '⚠️');
        return;
    }
    if (cart.length === 0) {
        showToast('Your cart is empty! Add items from the menu.', '🍽️');
        return;
    }
    if (!selectedTime) {
        showToast('Please select a pickup time', '⏰');
        return;
    }

    const tokenNum = 'CANTEEN-' + (100 + Math.floor(Math.random() * 900));
    const total = getCartTotal();

    const confirmToken = document.getElementById('confirmToken');
    const confirmTime = document.getElementById('confirmTime');
    const confirmLocation = document.getElementById('confirmLocation');
    const confirmTotal = document.getElementById('confirmTotal');

    if (confirmToken) confirmToken.textContent = tokenNum;
    if (confirmTime) confirmTime.textContent = selectedTime;
    if (confirmLocation) {
        const loc = document.getElementById('orderLocation');
        confirmLocation.textContent = loc ? loc.options[loc.selectedIndex].text : 'Counter 1';
    }
    if (confirmTotal) confirmTotal.textContent = `₹${total}`;

    localStorage.setItem('sggscc_last_token', tokenNum);
    localStorage.setItem('sggscc_last_order', JSON.stringify({
        token: tokenNum,
        items: [...cart],
        time: selectedTime,
        total: total,
        payment: selectedPayment,
        name: name,
        studentId: studentId
    }));

    cart = [];
    saveCart();
    updateCartUI();

    openModal('orderConfirmModal');
    showToast('Order placed successfully!', '🎉');
}

// ==================== MODALS ====================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ==================== REGISTRATION ====================
function nextRegStep(step) {
    document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('regStep' + step);
    if (target) target.classList.add('active');

    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('progDot' + i);
        if (!dot) continue;
        dot.classList.remove('active', 'done');
        if (i < step) dot.classList.add('done');
        if (i === step) dot.classList.add('active');
    }
}

function completeRegistration() {
    const name = document.getElementById('regName')?.value.trim();
    const studentId = document.getElementById('regStudentId')?.value.trim();

    if (name && studentId) {
        localStorage.setItem('sggscc_registered', 'true');
        localStorage.setItem('sggscc_user', JSON.stringify({ name, studentId }));

        const orderName = document.getElementById('orderName');
        const orderSID = document.getElementById('orderStudentId');
        if (orderName) orderName.value = name;
        if (orderSID) orderSID.value = studentId;
    }

    closeModal('regModal');
    showToast('Welcome to SGGSCC Canteen!', '🎉');
}

// ==================== STAR RATING ====================
const starRating = document.getElementById('starRating');
if (starRating) {
    const stars = starRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < rating);
            });
        });
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
                s.style.transform = i < rating ? 'scale(1.2)' : 'scale(1)';
            });
        });
    });
    starRating.addEventListener('mouseleave', () => {
        stars.forEach(s => s.style.transform = '');
    });
}

function submitFeedback() {
    showToast('Thank you for your feedback!', '💬');
}

// ==================== DAILY SPECIAL ====================
function updateDailySpecial() {
    const specials = [
        { name: 'Rajma Chawal Combo', desc: 'Piping hot rajma with steamed rice, salad & a cold drink. The ultimate comfort meal!', price: '₹55', oldPrice: '₹70', emoji: '🍲' },
        { name: 'Chole Bhature + Lassi', desc: 'Crispy bhature with spicy chole and a refreshing sweet lassi!', price: '₹65', oldPrice: '₹80', emoji: '🫓' },
        { name: 'Dosa + Filter Coffee', desc: 'Crispy masala dosa with coconut chutney and hot filter coffee!', price: '₹75', oldPrice: '₹90', emoji: '🥞' },
        { name: 'Pav Bhaji Special', desc: 'Extra butter pav bhaji with salad and a lemon soda!', price: '₹60', oldPrice: '₹80', emoji: '🍛' },
        { name: 'Noodles Manchurian Combo', desc: 'Hakka noodles with manchurian and a cold coffee!', price: '₹80', oldPrice: '₹100', emoji: '🍜' },
        { name: 'Samosa Party Pack', desc: '4 samosas + tea + chutney! Perfect for sharing with friends!', price: '₹45', oldPrice: '₹60', emoji: '🔺' },
        { name: 'Shahi Paneer Thali', desc: 'Shahi paneer, rumali roti, rice, salad & raita!', price: '₹99', oldPrice: '₹130', emoji: '👑' },
    ];

    const today = new Date().getDay();
    const special = specials[today] || specials[0];

    const nameEl = document.getElementById('specialName');
    const descEl = document.getElementById('specialDesc');
    const priceEl = document.getElementById('specialPrice');
    const emojiEl = document.querySelector('.daily-special .special-emoji');

    if (nameEl) nameEl.textContent = special.name;
    if (descEl) descEl.textContent = special.desc;
    if (priceEl) priceEl.textContent = special.price;
    if (emojiEl) emojiEl.textContent = special.emoji;

    const oldPriceEl = document.querySelector('.daily-special-price .old-price');
    if (oldPriceEl) oldPriceEl.textContent = special.oldPrice;
}

// ==================== CUTOFF TIMER ====================
function startCutoffTimer() {
    const timerEl = document.getElementById('cutoffTime');
    if (!timerEl) return;

    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(16, 30, 0, 0); // 4:30 PM cutoff

    if (now > cutoff) {
        timerEl.textContent = 'Closed';
        const timerContainer = document.getElementById('cutoffTimer');
        if (timerContainer) timerContainer.style.borderColor = 'rgba(232, 76, 61, 0.3)';
        return;
    }

    function update() {
        const now = new Date();
        const diff = cutoff - now;
        if (diff <= 0) {
            timerEl.textContent = 'Closed';
            return;
        }
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        timerEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    update();
    setInterval(update, 1000);
}

// ==================== ORDER STATUS (DEMO) ====================
function trackOrder() {
    const token = document.getElementById('tokenInput')?.value.trim();
    if (!token) {
        showToast('Please enter a token number', '⚠️');
        return;
    }

    const statusToken = document.getElementById('statusToken');
    if (statusToken) statusToken.textContent = token;

    const card = document.getElementById('orderStatusCard');
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }

    showToast('Order found! Showing status...', '📍');
}

function simulateStatus(step) {
    const steps = document.querySelectorAll('.order-timeline .timeline-step');
    const paymentStatus = document.getElementById('paymentStatus');

    steps.forEach((s, i) => {
        s.classList.remove('completed', 'active');
        if (i < step - 1) {
            s.classList.add('completed');
            s.querySelector('.step-dot').textContent = '✓';
        } else if (i === step - 1) {
            s.classList.add('active');
        }
    });

    if (step >= 5 && paymentStatus) {
        paymentStatus.classList.remove('pending-payment');
        paymentStatus.innerHTML = `
            <div>
                <div class="status-text">💳 Payment Status</div>
                <p style="font-size:0.8rem; color:var(--text-light); margin-top:3px;">Paid at counter</p>
            </div>
            <span class="status-badge paid">PAID ✓</span>`;
    }

    const messages = [
        'Order placed!',
        'Order confirmed by canteen!',
        'Your food is being prepared!',
        'Your food is READY at the counter!',
        'Order completed! Enjoy your meal!'
    ];
    const emojis = ['📝', '✅', '🔥', '🍱', '🎉'];
    showToast(messages[step - 1], emojis[step - 1]);
}

// ==================== DASHBOARD FILTER ====================
function filterDashOrders(status, btnEl) {
    document.querySelectorAll('.dashboard-orders .category-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const rows = document.querySelectorAll('#dashboardOrders tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ==================== FLOATING FOOD ANIMATION ====================
function createFloatingFood() {
    const foods = ['🍕', '☕', '🍜', '🥪'];
    const container = document.querySelector('.hero');
    if (!container) return;

    setInterval(() => {
        const food = document.createElement('div');
        food.className = 'floating-food';
        food.textContent = foods[Math.floor(Math.random() * foods.length)];
        food.style.left = (10 + Math.random() * 80) + '%';
        food.style.animationDuration = (16 + Math.random() * 8) + 's';
        container.appendChild(food);
        setTimeout(() => food.remove(), 24000);
    }, 8000);
}
createFloatingFood();

// ==================== AUTO-FILL FROM REGISTRATION ====================
(function autoFillFromRegistration() {
    const user = JSON.parse(localStorage.getItem('sggscc_user') || 'null');
    if (!user) return;

    const nameEl = document.getElementById('orderName');
    const sidEl = document.getElementById('orderStudentId');
    if (nameEl && !nameEl.value) nameEl.value = user.name;
    if (sidEl && !sidEl.value) sidEl.value = user.studentId;
})();

// ==================== COUNTER ANIMATION ====================
function animateCounters() {
    const counters = document.querySelectorAll('.hero-stat .number');
    counters.forEach(counter => {
        const text = counter.textContent;
        if (text.includes('₹') || text.includes('~') || text.includes('+')) return;
    });
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
});
