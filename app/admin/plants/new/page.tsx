import { PlantForm } from "../_components/PlantForm";

export const metadata = { title: "Add Plant — Haritham Garden Admin" };

export default function NewPlantPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add Plant</h1>
      <PlantForm />
    </div>
  );
}
