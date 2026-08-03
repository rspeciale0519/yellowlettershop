import { TypeVerification } from '@/components/database/type-verification'

export default function TestTypesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Database Type System Test</h1>
        <p className="text-gray-600 mb-6">
          This page verifies that the comprehensive database types are working correctly
          after the schema migration and type system updates.
        </p>
        <TypeVerification />
      </div>
    </div>
  )
}