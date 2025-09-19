# The Grand Chronicle - Section Banners Guide

This guide explains how to use the custom section banners in your blog posts.

## What Are Section Banners?

Section banners are styled headers that make your blog content more organized and visually appealing. They replace regular H2 headings with colorful banners that include icons and consistent styling.

![Section Banner Example](https://via.placeholder.com/800x100?text=Section+Banner+Example)

## Available Banner Types

### Newspaper Style (News Coo / Grand Chronicle themed)
These banners use amber/sepia colors to match The Grand Chronicle newspaper theme:

- **Royal Decree** - Crown icon, for important announcements
- **Voyage Log** - Ship icon, for journey stories
- **Grand Discoveries** - Compass icon, for tutorials
- **Reader's Corner** - Mail icon, for feedback
- **Treasure Maps** - Map icon, for resource collections
- **Captain's Log** - Pen icon, for personal reflections
- **Ancient Scrolls** - Scroll icon, for historical content
- **Tavern Tales** - Coffee icon, for casual stories

### Modern Style (Sloth Bytes inspired)
These banners use vibrant colors similar to Sloth Bytes:

- **Weekly Advice** - Lightbulb icon, blue
- **From Our Readers** - Message icon, amber
- **Interesting Reads** - Globe icon, purple
- **Weekly News** - Newspaper icon, blue
- **Weekly Challenge** - Code icon, red

## How to Use in Your Content

When writing your blog post content in BlockNoteEditor:

1. Create a level 2 heading (##) in your content
2. Use one of the predefined section names (e.g., `## Royal Decree`)
3. The renderer will automatically convert it to a styled banner

Example:
```markdown
## Royal Decree

This is important content that will appear under a Royal Decree banner with a crown icon.
```

## Demo Page

Visit the [Banner Demo Page](/banner-demo) to see all the available banners in action.

## Technical Implementation

The section banners are implemented using:

- `SectionBanner.tsx` - Base component for rendering banners
- `SectionBannerWithIcons.tsx` - Maps section names to icons and themes
- `BlockNoteRenderer.tsx` - Enhanced to replace H2 headings with banners

You can toggle between newspaper style and modern style by setting the `useNewspaperStyle` prop on the BlockNoteRenderer component.

## Adding New Banner Types

To add a new banner type:

1. Open `SectionBannerWithIcons.tsx`
2. Add your new section to the `SECTION_CONFIGS` object
3. Specify an icon, theme, and style

Example:
```typescript
'my new section': { 
  icon: <Star size={24} className="text-amber-900 dark:text-amber-100" />, 
  theme: 'royal',
  style: 'newspaper'
}
```
