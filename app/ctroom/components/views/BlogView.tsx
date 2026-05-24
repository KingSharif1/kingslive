'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText, ArrowUpRight, Plus, MessageSquare, Clock, ChevronRight,
    Loader2, Check, X, ChevronDown, Eye, TrendingUp, Heart, BarChart2,
    RefreshCw, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPublishedPosts, BlogPost } from '@/lib/sanity-queries';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostAnalytics {
    post_id: string;
    view_count: number;
    unique_visitors: number;
    avg_time_on_page: number;
    bounce_rate: number;
    likes: number;
    referrers?: Record<string, number>;
}

interface Comment {
    id: string;
    post_id: string;
    author_name: string;
    author_email: string;
    content: string;
    approved: boolean;
    created_at: string;
}

interface EnrichedPost extends BlogPost {
    analytics?: PostAnalytics;
    commentCount?: number;
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBar({ value, max, color = '#00ff88' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
    return (
        <div className="h-4 flex-1 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ seed, color = '#10b981' }: { seed: number; color?: string }) {
    const pts = Array.from({ length: 7 }, (_, i) => {
        const pseudo = Math.sin(seed * (i + 1) * 0.7 + i) * 0.5 + 0.5;
        return Math.round(pseudo * 24);
    });
    const max = Math.max(...pts, 1);
    const coords = pts.map((p, i) => `${(i / 6) * 96},${28 - (p / max) * 24}`).join(' L ');
    return (
        <svg viewBox="0 0 96 30" className="w-20 h-8" style={{ overflow: 'visible' }}>
            <polyline points={coords.replace(/ L /g, ' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 4px ${color}66)` }} />
        </svg>
    );
}

// ─── Analytics badge ──────────────────────────────────────────────────────────

function AnalyticsBadge({ icon: Icon, value, label, color }: {
    icon: React.ElementType; value: number | string; label: string; color: string;
}) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
            <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
            <span className="font-mono text-xs font-bold" style={{ color }}>{value}</span>
            <span className="font-mono text-[10px] text-white/30">{label}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const BlogView = () => {
    const [posts, setPosts] = useState<EnrichedPost[]>([]);
    const [analytics, setAnalytics] = useState<Record<string, PostAnalytics>>({});
    const [pendingComments, setPendingComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);

    // ── Derived stats ──
    const totalViews   = Object.values(analytics).reduce((s, a) => s + (a.view_count || 0), 0);
    const totalLikes   = Object.values(analytics).reduce((s, a) => s + (a.likes || 0), 0);
    const publishedPosts = posts.filter(p => p.published).length;
    const maxViews = Math.max(...Object.values(analytics).map(a => a.view_count || 0), 1);

    // ── Load data ──
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            // Fetch posts from Sanity
            const sanityPosts = await getPublishedPosts();

            // Fetch analytics from Supabase in one query
            const { data: analyticsData } = await supabase
                .from('blog_post_analytics')
                .select('*');

            // Fetch comments
            const { data: commentsData } = await supabase
                .from('blog_comments')
                .select('*')
                .eq('approved', false)
                .order('created_at', { ascending: false });

            // Build analytics map
            const analyticsMap: Record<string, PostAnalytics> = {};
            (analyticsData || []).forEach((row: any) => {
                analyticsMap[row.post_id] = row;
            });
            setAnalytics(analyticsMap);

            // Count comments per post
            const { data: allComments } = await supabase
                .from('blog_comments')
                .select('post_id, id')
                .eq('approved', true);
            const commentCounts: Record<string, number> = {};
            (allComments || []).forEach((c: any) => {
                commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
            });

            // Merge everything
            const enriched: EnrichedPost[] = sanityPosts.map(p => ({
                ...p,
                views: analyticsMap[p.id]?.view_count || 0,
                analytics: analyticsMap[p.id],
                commentCount: commentCounts[p.id] || 0,
            }));

            setPosts(enriched);
            setPendingComments((commentsData || []) as Comment[]);
        } catch (err) {
            console.error('BlogView load error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Track a view when admin opens a post ──
    const trackView = async (postId: string) => {
        await supabase
            .from('blog_post_analytics')
            .upsert({
                post_id: postId,
                view_count: (analytics[postId]?.view_count || 0) + 1,
                last_updated: new Date().toISOString(),
            }, { onConflict: 'post_id' });
        setAnalytics(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId],
                post_id: postId,
                view_count: (prev[postId]?.view_count || 0) + 1,
                unique_visitors: prev[postId]?.unique_visitors || 0,
                avg_time_on_page: prev[postId]?.avg_time_on_page || 0,
                bounce_rate: prev[postId]?.bounce_rate || 0,
                likes: prev[postId]?.likes || 0,
            }
        }));
    };

    const handleApproveComment = async (commentId: string) => {
        await supabase.from('blog_comments').update({ approved: true }).eq('id', commentId);
        setPendingComments(prev => prev.filter(c => c.id !== commentId));
    };

    const handleRejectComment = async (commentId: string) => {
        await supabase.from('blog_comments').delete().eq('id', commentId);
        setPendingComments(prev => prev.filter(c => c.id !== commentId));
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff}d ago`;
        if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

    return (
        <div className="h-full flex flex-col hq-scroll overflow-y-auto" style={{ background: '#080808', color: '#e5e5e5' }}>

            {/* ── HQ breadcrumb ── */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/25">
                    <span>CTROOM</span><span>/</span><span style={{ color: '#00ff88' }}>BLOG</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => loadData(true)} disabled={isRefreshing}
                        className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5"
                        title="Refresh analytics">
                        <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                    </button>
                    <button onClick={() => window.open('/blog', '_blank')}
                        className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5"
                        title="View Blog" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => window.open('/studio', '_blank')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-widest font-bold transition-all hover:opacity-90"
                        style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
                        <Plus className="w-3 h-3" /> New Post
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

            {/* ── Main Column ── */}
            <div className="flex-1 min-w-0 overflow-y-auto hq-scroll p-8 space-y-8">

                {/* ── Title ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-mono text-xl font-bold text-white tracking-tighter uppercase">BLOG</div>
                        <div className="font-mono text-[11px] text-white/25 mt-1">Posts, analytics & comments from your Sanity CMS.</div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px]"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                        {publishedPosts} POSTS LIVE
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { value: publishedPosts,  label: 'Published',     icon: FileText,   color: '#3b82f6' },
                        { value: fmtNum(totalViews), label: 'Total Views', icon: Eye,        color: '#00ff88' },
                        { value: totalLikes,      label: 'Likes',          icon: Heart,      color: '#f43f5e' },
                        { value: pendingComments.length, label: 'Pending',  icon: MessageSquare, color: '#f97316',
                          onClick: () => setShowComments(v => !v) },
                    ].map(({ value, label, icon: Icon, color, onClick }) => (
                        <button key={label} onClick={onClick}
                            className={cn('text-left rounded-xl p-4 transition-all', onClick && 'hover:border-white/10 cursor-pointer')}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-mono text-2xl font-bold text-white">{value}</div>
                                    <div className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
                                </div>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* ── Pending comments ── */}
                {showComments && pendingComments.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
                        <div className="px-5 py-3 flex items-center justify-between"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(249,115,22,0.05)' }}>
                            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest font-bold text-orange-400">
                                <MessageSquare className="w-3.5 h-3.5" />
                                Pending Comments ({pendingComments.length})
                            </div>
                            <button onClick={() => setShowComments(false)} style={{ color: 'rgba(255,255,255,0.25)' }}>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            {pendingComments.map(comment => (
                                <div key={comment.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="font-mono text-xs font-bold text-white/80">{comment.author_name}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                                <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDate(comment.created_at)}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                                <span className="font-mono text-[10px]" style={{ color: '#3b82f6' }}>/{comment.post_id}</span>
                                            </div>
                                            <p className="text-sm line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => handleApproveComment(comment.id)}
                                                className="p-1.5 rounded-lg transition-colors" title="Approve"
                                                style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                                                <Check className="w-3.5 h-3.5" style={{ color: '#00ff88' }} />
                                            </button>
                                            <button onClick={() => handleRejectComment(comment.id)}
                                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                                style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Posts list ── */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="px-5 py-3.5 flex items-center justify-between"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-3.5 h-3.5 text-white/25" />
                            <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-white/40">Posts &amp; Analytics</span>
                        </div>
                        <button onClick={() => window.open('/blog', '_blank')}
                            className="font-mono text-[10px] uppercase tracking-widest hover:text-white/50 transition-colors flex items-center gap-1"
                            style={{ color: 'rgba(255,255,255,0.2)' }}>
                            View Blog <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-16 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-16 text-center">
                            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                            <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No posts yet. Create your first in Sanity Studio.</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            {posts.map(post => {
                                const isExpanded = expandedPost === post.id;
                                const a = post.analytics;
                                return (
                                    <div key={post.id}>
                                        {/* Main row */}
                                        <div className="px-5 py-4 flex items-center gap-4 group cursor-pointer transition-colors hover:bg-white/[0.02]"
                                            onClick={() => setExpandedPost(isExpanded ? null : post.id)}>
                                            {/* Icon */}
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <FileText className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                            </div>

                                            {/* Title + meta */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: '#e5e5e5' }}>
                                                        {post.title}
                                                    </p>
                                                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold"
                                                        style={post.published ? {
                                                            background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88',
                                                        } : {
                                                            background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: '#eab308',
                                                        }}>
                                                        {post.published ? 'Live' : 'Draft'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDate(post.created_at)}</span>
                                                    {post.tags.length > 0 && (
                                                        <>
                                                            <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                                                            <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{post.tags.slice(0, 2).join(', ')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick analytics */}
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                {/* Stat clusters */}
                                                <div className="hidden md:flex items-center gap-5">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <div className="flex items-center gap-1 font-mono text-sm font-bold text-white">
                                                            <Eye className="w-3 h-3" style={{ color: 'rgba(0,255,136,0.5)' }} />
                                                            {fmtNum(a?.view_count || 0)}
                                                        </div>
                                                        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Views</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <div className="flex items-center gap-1 font-mono text-sm font-bold text-white">
                                                            <Heart className="w-3 h-3" style={{ color: 'rgba(244,63,94,0.6)' }} />
                                                            {a?.likes || 0}
                                                        </div>
                                                        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Likes</span>
                                                    </div>
                                                </div>
                                                {/* Sparkline */}
                                                <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {(a?.view_count || 0) > 0
                                                        ? <Sparkline seed={a!.view_count + post.id.charCodeAt(0)} color="#10b981" />
                                                        : <span className="font-mono text-[9px] italic w-20 text-center block" style={{ color: 'rgba(255,255,255,0.2)' }}>No data</span>
                                                    }
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">

                                                <button
                                                    onClick={e => { e.stopPropagation(); window.open(`/blog/${post.slug}`, '_blank'); trackView(post.id); }}
                                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                                                    title="Open post">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>

                                                <ChevronRight className="w-4 h-4 transition-transform duration-200"
                                                    style={{ color: 'rgba(255,255,255,0.15)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                                                </div>{/* end button group */}
                                            </div>{/* end quick analytics */}
                                        </div>{/* end main row */}

                                        {/* Expanded analytics row */}
                                        {isExpanded && (
                                            <div className="px-5 pb-5 pt-1"
                                                style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                {a ? (
                                                    <div className="space-y-4">
                                                        {/* Stat badges */}
                                                        <div className="flex flex-wrap gap-2">
                                                            <AnalyticsBadge icon={Eye}        value={fmtNum(a.view_count || 0)} label="views"    color="#00ff88" />
                                                            <AnalyticsBadge icon={TrendingUp}  value={fmtNum(a.unique_visitors || 0)} label="unique" color="#3b82f6" />
                                                            <AnalyticsBadge icon={Clock}       value={`${a.avg_time_on_page || 0}s`} label="avg time" color="#8b5cf6" />
                                                            <AnalyticsBadge icon={Heart}       value={a.likes || 0}              label="likes"   color="#f43f5e" />
                                                            <AnalyticsBadge icon={MessageSquare} value={post.commentCount || 0}  label="comments" color="#f97316" />
                                                            {a.bounce_rate > 0 && (
                                                                <AnalyticsBadge icon={BarChart2} value={`${Math.round(a.bounce_rate)}%`} label="bounce" color="#eab308" />
                                                            )}
                                                        </div>

                                                        {/* Referrers */}
                                                        {a.referrers && Object.keys(a.referrers).length > 0 && (
                                                            <div>
                                                                <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                                                    Top Referrers
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {Object.entries(a.referrers as Record<string, number>)
                                                                        .sort(([, a], [, b]) => b - a).slice(0, 4)
                                                                        .map(([ref, count]) => (
                                                                            <div key={ref} className="flex items-center gap-3">
                                                                                <span className="font-mono text-[10px] w-28 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{ref}</span>
                                                                                <MiniBar value={count} max={Math.max(...Object.values(a.referrers as Record<string, number>))} color="#3b82f6" />
                                                                                <span className="font-mono text-[10px] w-8 text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{count}</span>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <button
                                                                onClick={() => { window.open(`/blog/${post.slug}`, '_blank'); trackView(post.id); }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all"
                                                                style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
                                                                <ArrowUpRight className="w-3.5 h-3.5" /> Open Post
                                                            </button>
                                                            <button
                                                                onClick={() => window.open('/studio', '_blank')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all"
                                                                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
                                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'}>
                                                                Edit in Sanity
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 py-2">
                                                        <p className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                                            No analytics recorded yet. Open this post to start tracking views.
                                                        </p>
                                                        <button
                                                            onClick={() => { window.open(`/blog/${post.slug}`, '_blank'); trackView(post.id); }}
                                                            className="flex items-center gap-1 font-mono text-[11px] transition-colors"
                                                            style={{ color: '#00ff88' }}>
                                                            Open post <ArrowUpRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Bottom note ── */}
                <p className="font-mono text-[10px] text-center pb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    Analytics tracked via Supabase · Posts from Sanity CMS · Click any post to see details
                </p>

            </div>{/* end main column */}

            {/* ── Right Sidebar: Top Posts ── */}
            <div className="w-72 shrink-0 flex flex-col overflow-y-auto hq-scroll p-6 space-y-8"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>

                {/* Top Posts */}
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">Top Posts</h3>
                        <BarChart2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                    <div className="space-y-5">
                        {[...posts]
                            .sort((a, b) => (b.analytics?.view_count || 0) - (a.analytics?.view_count || 0))
                            .slice(0, 5)
                            .map((post, idx) => {
                                const views = post.analytics?.view_count || 0;
                                const topViews = Math.max(...posts.map(p => p.analytics?.view_count || 0), 1);
                                const pct = Math.max(4, (views / topViews) * 100);
                                return (
                                    <div key={post.id} className="group cursor-pointer" onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                                        <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <span className="font-bold text-white">{fmtNum(views)} Views</span>
                                        </div>
                                        <h4 className="text-xs font-medium mb-2 truncate group-hover:text-white transition-colors"
                                            style={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {post.title}
                                        </h4>
                                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: idx === 0 ? '#10b981' : idx === 1 ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.3)',
                                                }} />
                                        </div>
                                    </div>
                                );
                            })}
                        {posts.length === 0 && (
                            <p className="font-mono text-[10px] text-white/20">No posts yet</p>
                        )}
                    </div>
                </div>

                {/* Summary card */}
                <div className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15))', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="relative z-10">
                        <h3 className="font-mono text-xs font-bold text-white mb-1">Blog Stats</h3>
                        <div className="font-mono text-3xl font-bold text-white">{fmtNum(totalViews)}</div>
                        <p className="font-mono text-[10px] mt-1" style={{ color: '#10b981' }}>
                            Total Views
                        </p>
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between font-mono text-[10px]">
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Published</span>
                                <span className="text-white font-bold">{publishedPosts}</span>
                            </div>
                            <div className="flex justify-between font-mono text-[10px]">
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total Likes</span>
                                <span className="text-white font-bold">{totalLikes}</span>
                            </div>
                            <div className="flex justify-between font-mono text-[10px]">
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Pending</span>
                                <span style={{ color: pendingComments.length > 0 ? '#f97316' : 'rgba(255,255,255,0.8)' }} className="font-bold">
                                    {pendingComments.length}
                                </span>
                            </div>
                        </div>
                    </div>
                    <FileText className="absolute -right-4 -bottom-4 w-20 h-20" style={{ color: 'rgba(255,255,255,0.04)' }} />
                </div>

                {/* CMS link */}
                <button onClick={() => window.open('/studio', '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                    <Plus className="w-3.5 h-3.5" />
                    New Post in Sanity
                </button>

            </div>{/* end right sidebar */}

            </div>{/* end flex container */}
        </div>
    );
};
