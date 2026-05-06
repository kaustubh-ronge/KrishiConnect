import { useState } from 'react';
import { toast } from 'sonner';

export function useFetch(action) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action(...args);
      
      if (result?.error || result?.success === false) {
        setError(result?.error || "Something went wrong");
        toast.error(result?.error || "Something went wrong");
        return result;
      }
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, execute };
}
