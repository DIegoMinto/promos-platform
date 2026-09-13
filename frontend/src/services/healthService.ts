export type HealthResponse = {
  status: string;
  message: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('http://localhost:3000/api/health');

  if (!response.ok) {
    throw new Error('No se pudo conectar con la API');
  }

  return response.json();
}