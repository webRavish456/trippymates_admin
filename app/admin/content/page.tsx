"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BlogPostsTab } from "@/components/content/blog-posts-tab"
import { ArticlesTab } from "@/components/content/articles-tab"
import { TestimonialsTab } from "@/components/content/testimonials-tab"
import { FAQsTab } from "@/components/content/faqs-tab"

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Content Management</h1>
        <p className="text-muted-foreground">Manage blog posts, testimonials, and FAQs</p>
      </div>

      <Tabs defaultValue="blog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="blog">Blog Posts</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-4">
          <BlogPostsTab sectionType="main" />
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <ArticlesTab />
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <TestimonialsTab />
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <FAQsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}