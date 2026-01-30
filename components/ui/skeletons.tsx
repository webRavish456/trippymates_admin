import { Skeleton } from "@mui/material"
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TableCell, TableRow } from "@/components/ui/table"

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton variant="text" width="80%" height={20} />
        </TableCell>
      ))}
    </TableRow>
  )
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton variant="text" width="60%" height={30} />
        <Skeleton variant="text" width="40%" height={20} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton variant="rectangular" width="100%" height={100} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="70%" height={20} />
      </CardContent>
    </Card>
  )
}

// Destination Card Skeleton
export function DestinationCardSkeleton() {
  return (
    <Card>
      <Skeleton variant="rectangular" width="100%" height={200} />
      <CardContent className="space-y-3 pt-4">
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="50%" height={20} />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </CardContent>
    </Card>
  )
}

// Package Card Skeleton
export function PackageCardSkeleton() {
  return (
    <Card>
      <Skeleton variant="rectangular" width="100%" height={180} />
      <CardContent className="space-y-3 pt-4">
        <Skeleton variant="text" width="80%" height={26} />
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="60%" height={20} />
        <div className="flex justify-between items-center mt-4">
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="rectangular" width={80} height={36} />
        </div>
      </CardContent>
    </Card>
  )
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
      ))}
      <div className="flex gap-4 justify-end">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={32} />
          </div>
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </CardContent>
    </Card>
  )
}

// List Skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </div>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      ))}
    </div>
  )
}

// Edit page skeleton (back button + title + card with form fields)
export function EditPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ShadcnSkeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <ShadcnSkeleton className="h-8 w-56" />
          <ShadcnSkeleton className="h-4 w-72" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <ShadcnSkeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <ShadcnSkeleton className="h-4 w-24" />
              <ShadcnSkeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <ShadcnSkeleton className="h-4 w-24" />
              <ShadcnSkeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <ShadcnSkeleton className="h-4 w-32" />
            <ShadcnSkeleton className="h-24 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <ShadcnSkeleton className="h-4 w-28" />
              <ShadcnSkeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <ShadcnSkeleton className="h-4 w-28" />
              <ShadcnSkeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <ShadcnSkeleton className="h-10 w-24" />
            <ShadcnSkeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

