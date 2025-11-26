'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Clock, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { globalSearch, saveSearchHistory, getSearchHistory, clearSearchHistory, type SearchResult, type SearchFilters } from '@/lib/search';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'relevance',
  });
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
    }
  }, [open]);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await globalSearch(term, filters);
      setResults(searchResults);
      if (term.trim()) {
        saveSearchHistory(term);
        setHistory(getSearchHistory());
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    saveSearchHistory(searchTerm);
    onOpenChange(false);
    
    switch (result.type) {
      case 'post':
        router.push(`/dashboard?post=${result.id}`);
        break;
      case 'user':
        router.push(`/dashboard/profile/${result.id}`);
        break;
      case 'community':
        router.push(`/dashboard/communities/${result.id}`);
        break;
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
    performSearch(term);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search across posts, users, and communities
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                }}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            {showFilters && (
              <div className="flex gap-2 flex-1">
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, type: value as any })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="community">Communities</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy || 'relevance'}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px] px-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Searching...</div>
          ) : searchTerm ? (
            results.length > 0 ? (
              <div className="space-y-2 pb-4">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3"
                  >
                    {result.image && (
                      <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={result.image}
                          alt={result.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                        <h4 className="font-medium truncate">{result.title}</h4>
                      </div>
                      {result.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No results found
              </div>
            )
          ) : (
            <div className="pb-4">
              {history.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearSearchHistory();
                        setHistory([]);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {history.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(term)}
                        className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{term}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Start typing to search...
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

