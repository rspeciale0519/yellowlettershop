"use client"

import { useState } from "react"
import { Key, Copy, MoreHorizontal, Trash, Eye, EyeOff, RefreshCw, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ApiKeysPage() {
  // Rename the state variable to avoid naming conflict
  const [apiKeysList, setApiKeysList] = useState([])
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"])
  const [newKeyExpiration, setNewKeyExpiration] = useState("1year")
  const [newKeyCreated, setNewKeyCreated] = useState(false)
  const [newKey, setNewKey] = useState("")

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "expiring_soon":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Expiring Soon
          </Badge>
        )
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleCreateKey = () => {
    // In a real app, this would call an API to create a new key
    const newKeyValue = `sk_${newKeyPermissions.includes("write") ? "prod" : "dev"}_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`

    // Calculate expiration date
    const now = new Date()
    let expiresAt = new Date()

    if (newKeyExpiration === "30days") {
      expiresAt.setDate(now.getDate() + 30)
    } else if (newKeyExpiration === "90days") {
      expiresAt.setDate(now.getDate() + 90)
    } else if (newKeyExpiration === "1year") {
      expiresAt.setFullYear(now.getFullYear() + 1)
    } else if (newKeyExpiration === "never") {
      expiresAt = new Date(2099, 11, 31) // Far future date
    }

    const newApiKey = {
      id: `k${apiKeysList.length + 1}`,
      name: newKeyName,
      key: newKeyValue,
      created: now.toISOString().split("T")[0],
      lastUsed: null,
      expiresAt: expiresAt.toISOString().split("T")[0],
      permissions: newKeyPermissions,
      status: "active",
    }

    setNewKey(newKeyValue)
    setNewKeyCreated(true)
    setApiKeysList((prev) => [...prev, newApiKey])
  }

  const handleDeleteKey = (id: string) => {
    // In a real app, this would call an API to delete the key
    setApiKeysList((prev) => prev.filter((key) => key.id !== id))
  }

  const handleRegenerateKey = (id: string) => {
    // In a real app, this would call an API to regenerate the key
    const newKeyValue = `sk_regen_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`

    setApiKeysList((prev) =>
      prev.map((key) => {
        if (key.id === id) {
          return {
            ...key,
            key: newKeyValue,
            created: new Date().toISOString().split("T")[0],
          }
        }
        return key
      }),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <Button
          onClick={() => {
            setNewKeyName("")
            setNewKeyPermissions(["read"])
            setNewKeyExpiration("1year")
            setNewKeyCreated(false)
            setCreateDialogOpen(true)
          }}
        >
          <Key className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>Manage your API keys for accessing the Yellow Letter Shop API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Protect your API keys</AlertTitle>
                <AlertDescription>
                  Your API keys carry many privileges. Keep them secure and never share them in public repositories or
                  client-side code.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">API Key</th>
                      <th className="px-4 py-3 text-left font-medium">Permissions</th>
                      <th className="px-4 py-3 text-left font-medium">Created</th>
                      <th className="px-4 py-3 text-left font-medium">Expires</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeysList.length > 0 ? (
                      apiKeysList.map((apiKey) => (
                        <tr key={apiKey.id} className="border-b">
                          <td className="px-4 py-3 font-medium">{apiKey.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                                {showKeys[apiKey.id]
                                  ? apiKey.key
                                  : `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}`}
                              </code>
                              <Button variant="ghost" size="icon" onClick={() => toggleKeyVisibility(apiKey.id)}>
                                {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  navigator.clipboard.writeText(apiKey.key)
                                  // In a real app, you would show a toast notification
                                  alert("API key copied to clipboard")
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-1">
                              {apiKey.permissions.includes("read") && <Badge variant="outline">Read</Badge>}
                              {apiKey.permissions.includes("write") && <Badge variant="outline">Write</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3">{formatDate(apiKey.created)}</td>
                          <td className="px-4 py-3">
                            {apiKey.expiresAt === "2099-12-31" ? "Never" : formatDate(apiKey.expiresAt)}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(apiKey.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleKeyVisibility(apiKey.id)}>
                                  {showKeys[apiKey.id] ? (
                                    <>
                                      <EyeOff className="mr-2 h-4 w-4" />
                                      Hide Key
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Show Key
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(apiKey.key)
                                    // In a real app, you would show a toast notification
                                    alert("API key copied to clipboard")
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Key
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRegenerateKey(apiKey.id)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Regenerate Key
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteKey(apiKey.id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Key
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No API keys found. Create your first API key to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>Monitor your API usage and view request logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">No data available yet</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">No data available yet</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground">No data available yet</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
