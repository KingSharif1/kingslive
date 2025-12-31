import React, { useState, useEffect } from 'react';
import { FileText, ArrowUpRight, Plus, MessageSquare, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPublishedPosts, BlogPost } from '@/lib/sanity-queries';
import { supabase } from '@/lib/supabase';

interface BlogStats {
    publishedPosts: number;
    totalComments: number;
    pendingComments: number;
}

export const BlogView = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [stats, setStats] = useState<BlogStats>({ publishedPosts: 0, totalComments: 0, pendingComments: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBlogData = async () => {
            setIsLoading(true);
            try {
                // Fetch posts from Sanity
                const sanityPosts = await getPublishedPosts();
                setPosts(sanityPosts.slice(0, 5)); // Show only 5 most recent

                // Fetch comment stats from Supabase
                const { data: comments } = await supabase
                    .from('blog_comments')
                    .select('approved');

                const totalComments = comments?.length || 0;
                const pendingComments = comments?.filter(c => !c.approved).length || 0;

                setStats({
                    publishedPosts: sanityPosts.filter(p => p.published).length,
                    totalComments,
                    pendingComments
                });
            } catch (error) {
                console.error('Error loading blog data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBlogData();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const openSanityStudio = () => {
        window.open('/studio', '_blank');
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-500" />
                        Blog Management
                    </h2>
                    <p className="text-muted-foreground">Manage your posts and comments from Sanity CMS.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => window.open('/blog', '_blank')}
                        className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                        title="View Blog"
                    >
                        <ArrowUpRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={openSanityStudio}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Post
                    </button>
                </div>
            </div>

            {/* Blog Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold">{stats.publishedPosts}</div>
                        <div className="text-sm text-muted-foreground font-medium">Published Posts</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold">{stats.totalComments}</div>
                        <div className="text-sm text-muted-foreground font-medium">Comments</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold">{stats.pendingComments}</div>
                        <div className="text-sm text-muted-foreground font-medium">Pending Review</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border/40 flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Recent Posts</h3>
                    <button 
                        onClick={() => window.open('/blog', '_blank')}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        View All
                    </button>
                </div>
                
                {isLoading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No posts yet. Create your first post in Sanity Studio!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {posts.map((post) => (
                            <div 
                                key={post.id} 
                                className="p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between group cursor-pointer"
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm group-hover:text-primary transition-colors">{post.title}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span>{formatDate(post.created_at)}</span>
                                            <span>•</span>
                                            <span>{post.views} views</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase border",
                                        post.published ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    )}>
                                        {post.published ? 'Published' : 'Draft'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
