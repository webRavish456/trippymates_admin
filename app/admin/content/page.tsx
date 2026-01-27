"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BlogPostsTab } from "@/components/content/blog-posts-tab"
import { ArticlesTab } from "@/components/content/articles-tab"
import { TestimonialsTab } from "@/components/content/testimonials-tab"
import { FAQsTab } from "@/components/content/faqs-tab"
import { AdventurePostsTab } from "@/components/content/adventure-posts-tab"

export default function ContentPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("blog")

  useEffect(() => {
    if (tabParam && ["blog", "articles", "testimonials", "faqs", "adventure"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Content Management</h1>
        <p className="text-muted-foreground">Manage blog posts, testimonials, and FAQs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="blog">Blog Posts</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="adventure">Adventure Posts</TabsTrigger>
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

        <TabsContent value="adventure" className="space-y-4">
          <AdventurePostsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}