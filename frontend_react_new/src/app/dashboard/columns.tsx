"use client"

import { type ColumnDef } from "@tanstack/react-table";
import { type Post } from "~/server/db/schema";

export const columns: ColumnDef<Post>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "createdById",
    header: "Created By",
  },
]; 