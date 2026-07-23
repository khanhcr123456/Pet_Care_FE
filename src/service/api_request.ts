const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const getHeaders = () => {
    const token = localStorage.getItem('adminAccessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const memCache: Record<string, any> = {};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    });

    if (res.status === 401 || res.status === 403) {
        throw new Error('Phiên đăng nhập hết hạn hoặc bạn không có quyền Admin. Vui lòng F5 và đăng nhập lại.');
    }

    try {
        const data = await res.json();
        return data;
    } catch {
        return res;
    }
};

export const apiLogin = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return { res, data };
};

export const apiLogout = () => apiFetch('/auth/logout', { method: 'POST' });
export const fetchFcmReport = () => apiFetch('/firebase/fcm-board');
export const fetchFirebaseUsers = () => apiFetch('/firebase/users?limit=100');
export const fetchFirebaseAnalytics = async () => {
    return apiFetch('/firebase/analytics');
};

export const fetchRemoteConfigTheme = async () => {
    return apiFetch('/firebase/remote-config');
};

export const updateRemoteConfigTheme = async (theme: string) => {
    return apiFetch('/firebase/remote-config', {
        method: 'PUT',
        body: JSON.stringify({ app_theme_event: theme })
    });
};
export const sendBroadcastNotification = (payload: { title: string; body: string; type?: string; metadata?: any }) =>
    apiFetch('/firebase/send-notification-all', { method: 'POST', body: JSON.stringify(payload) });
export const toggleUserStatus = (uid: string, disabled: boolean) =>
    apiFetch(`/firebase/users/${uid}/status`, { method: 'PUT', body: JSON.stringify({ disabled }) });
export const deleteFirebaseUser = (uid: string) =>
    apiFetch(`/firebase/users/${uid}`, { method: 'DELETE' });


// ==============================================================================
// LỚP Request_API DÀNH CHO CÁC COMPONENT ĐƯỢC CHUYỂN TỪ PAWRENT QUA
// ==============================================================================
export default class Request_API {
    baseURL: string;
    customToken: string | null;

    constructor(baseURL = "", customToken = null) {
        const rawBase = baseURL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
        const normalizedBase = rawBase.replace(/\/+$/, "");
        this.baseURL = normalizedBase.endsWith("/api/v1") ? normalizedBase : `${normalizedBase}/api/v1`;
        this.customToken = customToken;
    }

    getTokenFromCookie() {
        // Sửa Next.js cookies thành localStorage dành cho Vite Frontend
        return localStorage.getItem('adminAccessToken') || null;
    }

    buildUrl(endpoint: string) {
        if (/^https?:\/\//i.test(endpoint)) return endpoint;
        const normalizedBase = this.baseURL.replace(/\/+$/, "");
        const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        return `${normalizedBase}${normalizedEndpoint}`;
    }

    async parseResponse(response: Response) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            try { return await response.json(); } catch { return null; }
        }
        try {
            const text = await response.text();
            return text ? { message: text } : null;
        } catch { return null; }
    }

    async request(endpoint: string, options: RequestInit = {}) {
        try {
            const token = this.customToken || this.getTokenFromCookie();
            const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
            const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };

            if (!isFormData && !headers["Content-Type"]) {
                headers["Content-Type"] = "application/json";
            }

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const fullUrl = this.buildUrl(endpoint);
            const response = await fetch(fullUrl, { headers, ...options });
            const payload = await this.parseResponse(response);

            if (!response.ok) {
                const message = payload?.message || payload?.error || `Request failed with status ${response.status}`;
                const error = new Error(message) as any;
                error.status = response.status;
                error.payload = payload;

                // Handle unauthorized globally for admin components by redirecting
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('adminAccessToken');
                    window.location.href = '/';
                }

                throw error;
            }
            return payload;
        } catch (error) {
            throw error;
        }
    }

    async get(endpoint: string, options = {}) { return this.request(endpoint, { method: "GET", ...options }); }
    async post(endpoint: string, body: any) {
        return this.request(endpoint, {
            method: "POST",
            body: typeof FormData !== "undefined" && body instanceof FormData ? body : JSON.stringify(body),
        });
    }
    async put(endpoint: string, body: any) {
        return this.request(endpoint, {
            method: "PUT",
            body: typeof FormData !== "undefined" && body instanceof FormData ? body : JSON.stringify(body),
        });
    }
    async delete(endpoint: string) { return this.request(endpoint, { method: "DELETE" }); }

    // AUTH
    async login(email: string, password: string) { return this.post("/auth/login", { email, password }); }
    async loginGoogle(idToken: string) { return this.post("/auth/google", { idToken }); }
    async refreshToken(refreshTokenValue: string) { return this.post("/auth/refresh-token", { refreshToken: refreshTokenValue }); }
    async register(fullName: string, email: string, phone: string, password: string, role: string) { return this.post("/auth/register", { fullName, email, phone, password, role }); }
    async logout() { return this.post("/auth/logout", {}); }
    async getCurrentUser() { return this.get("/auth/me"); }
    async updateProfile(profileData: any, avatarFile: any) {
        if (avatarFile) {
            const formData = new FormData();
            Object.entries(profileData || {}).forEach(([key, value]) => {
                if (value !== undefined && value !== null) formData.append(key, String(value));
            });
            formData.append("avatar", avatarFile);
            return this.put("/auth/profile", formData);
        }
        return this.put("/auth/profile", profileData);
    }

    // PETS
    async getPets() { return this.get("/pets"); }
    async getAllPets() { return this.get("/pets/all"); }
    async getPetById(id: string) { return this.get(`/pets/info/${id}`); }
    async updatePetById(id: string, petData: any) { return this.put(`/pets/${id}`, petData); }
    async deletePetById(id: string) { return this.delete(`/pets/${id}`); }
    async addPet(petData: any) { return this.post("/pets", petData); }

    // VETS
    async getVets(page = 1, limit = 1000) { return this.get(`/auth/vets?page=${page}&limit=${limit}`); }

    // ADMIN USERS
    async getAdminUsers(page = 1, limit = 1000, options = {}) { return this.get(`/admin/users?page=${page}&limit=${limit}`, options); }
    async updateAdminUser(userId: string, data: any) { return this.put(`/admin/users/${userId}`, data); }

    // HEALTH RECORDS
    async addHealthRecord(recordData: any) { return this.post("/health-records", recordData); }
    async getHealthRecords() { return this.get("/health-records"); }
    async getHealthRecordByAppointmentId(appointmentId: string, page = 1, limit = 1000) { return this.get(`/health-records/appointment/${appointmentId}?page=${page}&limit=${limit}&sortBy=-createdAt`); }

    // VACCINATIONS
    async addVaccination(vaccinationData: any) { return this.post("/vaccinations", vaccinationData); }
    async getVaccinationsByPetId(petId: string) { return this.get(`/vaccinations/pet/${petId}`); }

    // APPOINTMENTS
    async createAppointment(appointmentData: any) { return this.post("/appointments", appointmentData); }
    async getAllAppointments(petId?: string) { return petId ? this.get(`/appointments/all?petId=${petId}`) : this.get("/appointments/all"); }
    async getAvailableSlots(vetId: string, date: string) { return date ? this.get(`/appointments/available-slots?vetId=${vetId}&date=${date}`, { cache: "no-store" }) : this.get(`/appointments/available-slots?vetId=${vetId}&days=7`, { cache: "no-store" }); }
    async getVetAppointments(vetId: string, page = 1, limit = 1000) { return this.get(`/appointments/vet/${vetId}?page=${page}&limit=${limit}`); }
    async getAppointments(page = 1, limit = 1000) { return this.get(`/appointments?page=${page}&limit=${limit}`); }
    async getAppointmentById(id: string) { return this.get(`/appointments/${id}`); }
    async deleteAppointmentById(id: string) { return this.delete(`/appointments/${id}`); }
    async updateAppointmentStatus(id: string, status: string) { return this.put(`/appointments/${id}/status`, { status }); }
    async finishExam(appointmentId: string, recordData: any) {
        const healthRecord = await this.addHealthRecord(recordData);
        const updatedAppointment = await this.updateAppointmentStatus(appointmentId, "hoàn_thành");
        return { healthRecord, updatedAppointment };
    }

    // HOTELS
    async getHotelById(id: string) { return this.get(`/hotels/${id}`); }
    async bookHotel(bookingData: any) { return this.post("/hotel-bookings", bookingData); }
    async createHotel(hotelData: any) { return this.post("/hotels", hotelData); }
    async updateHotel(id: string, hotelData: any) { return this.put(`/hotels/${id}`, hotelData); }
    async deleteHotel(id: string) { return this.delete(`/hotels/${id}`); }
    async getMyHotel() { return this.get("/hotels/my"); }
    async cancelHotelBooking(id: string, payload: any) { return this.put(`/hotel-bookings/${id}/cancel`, payload); }
    async updateHotelBookingStatus(id: string, status: string) { return this.put(`/hotel-bookings/${id}/status`, { status }); }
    async getOwnerHotelBookings(page = 1, limit = 1000, options = {}) { return this.get(`/hotel-bookings/owner/all?page=${page}&limit=${limit}`, options); }

    // SERVICES
    async getServices(page = 1, limit = 20, sortBy = "-createdAt", options = {}) { return this.get(`/services?sortBy=${encodeURIComponent(sortBy)}&page=${page}&limit=${limit}`, options); }
    async createService(serviceData: any) { return this.post("/services", serviceData); }
    async updateService(id: string, serviceData: any) { return this.put(`/services/${id}`, serviceData); }
    async deleteService(id: string) { return this.delete(`/services/${id}/permanent`); }

    // PRODUCTS
    async getProducts(options = {}) { return this.get("/products", options); }
    async getProductById(id: string, options = {}) { return this.get(`/products/${id}`, options); }
    async createProduct(productData: any) { return this.post("/products", productData); }
    async updateProduct(id: string, productData: any) { return this.put(`/products/${id}`, productData); }
    async deleteProduct(id: string) { return this.delete(`/products/${id}`); }
    async addProductToCart(id: string, cartData = {}) { return this.post(`/products/${id}/cart`, cartData); }

    // CHATBOT
    async chat(petId: string, message: string, sessionId: string) { return this.post("/chat", { petId, message, sessionId }); }
    async getChatHistory(petId: string) { return this.get(`/chat/history?petId=${petId}`); }
    async getChatSession(sessionId: string) { return this.get(`/chat/${sessionId}`); }

    // CART
    async getCart() { return this.get("/products/cart"); }
    async updateCartItem(productId: string, quantity: number) { return this.put(`/products/${productId}/cart`, { quantity }); }
    async removeFromCart(productId: string) { return this.delete(`/products/${productId}/cart`); }
    async clearCart() { return this.delete("/products/cart"); }

    // INVOICES / SUBSCRIPTION
    async getInvoices(page = 1, limit = 1000, options = {}) { return this.get(`/invoices?page=${page}&limit=${limit}`, options); }
    async createBookingInvoice(appointmentId: string) { return this.post("/invoices/booking", { appointmentId }); }
    async createProductInvoice(products: any[], payload = {}) { return this.post("/invoices/products", { products, ...payload }); }
    async createSubscriptionInvoice(subscriptionPlan: any) { return this.post("/invoices/subscription", { subscriptionPlan }); }
    async getInvoiceById(id: string) { return this.get(`/invoices/${id}`); }
    async cancelInvoice(id: string) { return this.delete(`/invoices/${id}`); }
    async updateOrderStatus(id: string, status: string) {
        return this.request(`/invoices/${id}/order-status`, {
            method: "PATCH",
            body: JSON.stringify({ orderStatus: status }),
        });
    }

    // PAYMENTS / SEPAY
    async createSepayCheckout(invoiceId: string, options: any = {}) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        return this.post("/payments/sepay/checkout/init", {
            invoiceId,
            successUrl: options.successUrl || `${baseUrl}/`,
            errorUrl: options.errorUrl || `${baseUrl}/`,
            cancelUrl: options.cancelUrl || `${baseUrl}/`,
        });
    }
    async simulateCODPayment(invoiceId: string) { return this.post("/payments/cod", { invoiceId }); }
}
