import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';

// Define a estrutura dos dados do nosso contexto
interface FavoritesContextType {
  favoritePaths: string[];
  toggleFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
  isLoaded: boolean;
}

// Cria o contexto com um valor padrão para evitar erros
export const FavoritesContext = createContext<FavoritesContextType>({
  favoritePaths: [],
  toggleFavorite: () => console.warn('toggleFavorite chamado fora do provider'),
  isFavorite: () => false,
  isLoaded: false,
});

// Cria um "hook" personalizado para facilitar o uso do contexto nos componentes
export const useFavorites = () => useContext(FavoritesContext);

// Componente "Provider" que irá centralizar e distribuir o estado
export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const [favoritePaths, setFavoritePaths] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // A chave do localStorage continua a ser única para cada usuário
  const storageKey = useMemo(() => {
    if (!user) return null;
    return `moduleFavorites_${user.id}`;
  }, [user]);

  // Efeito para carregar os favoritos do localStorage quando o usuário muda
  useEffect(() => {
    if (!storageKey) {
      setFavoritePaths([]);
      setIsLoaded(true);
      return;
    }
    try {
      const storedRaw = localStorage.getItem(storageKey);
      const items = storedRaw ? JSON.parse(storedRaw) : [];
      if (Array.isArray(items)) {
        setFavoritePaths(items);
      }
    } catch (error) {
      console.error("Falha ao carregar favoritos do localStorage", error);
      setFavoritePaths([]);
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Efeito para salvar os favoritos no localStorage sempre que eles mudam
  useEffect(() => {
    if (isLoaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(favoritePaths));
    }
  }, [favoritePaths, storageKey, isLoaded]);

  // Função para adicionar/remover um favorito, agora centralizada
  const toggleFavorite = useCallback((path: string) => {
    setFavoritePaths(prevPaths => {
      const newPaths = new Set(prevPaths);
      if (newPaths.has(path)) {
        newPaths.delete(path);
      } else {
        newPaths.add(path);
      }
      return Array.from(newPaths);
    });
  }, []);

  const isFavorite = useCallback((path: string) => favoritePaths.includes(path), [favoritePaths]);

  // O valor que será partilhado com todos os componentes filhos
  const value = { favoritePaths, toggleFavorite, isFavorite, isLoaded };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
