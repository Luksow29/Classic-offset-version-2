
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Loader2, Package, FileText, MessageSquare } from 'lucide-react';
import debounce from 'lodash.debounce';
import { useNavigate } from 'react-router-dom';

const getIcon = (type: string) => {
    switch (type) {
        case 'Order': return <Package className="mr-2 h-4 w-4" />;
        case 'Invoice': return <FileText className="mr-2 h-4 w-4" />;
        case 'Request': return <MessageSquare className="mr-2 h-4 w-4" />;
        default: return <Search className="mr-2 h-4 w-4" />;
    }
};

export function GlobalSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const debouncedSearch = useCallback(
        debounce(async (term: string) => {
            if (term.length < 3) {
                setResults([]);
                setIsLoading(false);
                return;
            }
            const { data, error } = await supabase.rpc('global_search', { search_term: term });
            if (error) {
                console.error('Search error:', error);
            } else {
                setResults(data);
            }
            setIsLoading(false);
        }, 300),
        []
    );

    useEffect(() => {
        if (searchTerm) {
            setIsLoading(true);
            debouncedSearch(searchTerm);
        } else {
            setIsLoading(false);
            setResults([]);
        }
    }, [searchTerm, debouncedSearch]);

    const handleSelect = (link: string) => {
        setIsOpen(false);
        navigate(link);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders, invoices..."
                        className="w-full pl-10"
                        onFocus={() => setIsOpen(true)}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                 <Command>
                    <CommandInput 
                        placeholder="Type to search..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        {isLoading && <CommandEmpty>
                            <div className="p-4 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </CommandEmpty>}

                        {!isLoading && results.length === 0 && searchTerm.length > 2 && (
                            <CommandEmpty>No results found.</CommandEmpty>
                        )}
                        
                        {results.length > 0 && (
                             <CommandGroup heading="Search Results">
                                {results.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        onSelect={() => handleSelect(item.link)}
                                        className="cursor-pointer"
                                    >
                                        {getIcon(item.type)}
                                        <span>{item.title}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
