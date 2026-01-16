type Trail = {
  _id: string;
  name: string;
  lengthInKm?: number;
  difficulty?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
  date?: string;
};

type Collection = {
  _id: string;
  name: string;
  description?: string;
  walkingTrailIds?: string[];
};

type Category = {
  value: string;
  title: string;
  description?: string;
  icon?: string;
};

function initializeUser() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('loggedInUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Ignore JSON parse errors
      }
    }
  }
  return {
    email: "",
    username: "",
    name: "",
    token: "",
    _id: "",
  };
}

export const loggedInUser = $state(initializeUser());

export const currentTrails = $state({
  trails: [] as Trail[],
});

export const currentCollections = $state({
  collections: [] as Collection[],
});

export const currentCategories = $state({
  categories: [] as Category[],
});

export const dashboardState = $state({
  activeTab: 'trails' as const,
}) as { activeTab: 'trails' | 'collections' };

function persistUser() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
  }
}

export function clearSession() {
  loggedInUser.email = "";
  loggedInUser.username = "";
  loggedInUser.name = "";
  loggedInUser.token = "";
  loggedInUser._id = "";
  currentTrails.trails = [];
  currentCollections.collections = [];
  if (typeof window !== 'undefined') {
    localStorage.removeItem('loggedInUser');
  }
}

export function saveUser() {
  persistUser();
}

async function authorizedFetch<T>(url: string): Promise<T | null> {
  if (!loggedInUser.token) return null;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${loggedInUser.token}` },
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function refreshTrails(userId: string) {
  const data = await authorizedFetch<Trail[]>(`http://localhost:3000/api/trails/getByUserId/${userId}`);
  if (data) {
    currentTrails.trails = data;
  }
}

export async function refreshCollections(userId: string) {
  const data = await authorizedFetch<Collection[]>(`http://localhost:3000/api/collections/getByUserId/${userId}`);
  if (data) {
    currentCollections.collections = data;
  }
}

export async function loadCategories() {
  if (currentCategories.categories.length > 0) {
    return;
  }
  const data = await authorizedFetch<Category[]>(`http://localhost:3000/api/categories/all`);
  if (data) {
    currentCategories.categories = data;
  }
}

export function getTrailById(trailId: string): Trail | null {
  return currentTrails.trails.find(t => t._id === trailId) || null;
}
