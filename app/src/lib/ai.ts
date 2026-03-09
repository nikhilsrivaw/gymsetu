import { supabase } from './supabase';                                                                        
                                                                                                                
  export async function askAI(type: string, data: Record<string, any>): Promise<string> {
    const { data: result, error } = await supabase.functions.invoke('ai-assistant', {
      body: { type, data },
    });

    if (error) throw new Error(`Function error: ${error.message} | ${JSON.stringify(error)}`);
    if (!result?.text) throw new Error(`No text in response: ${JSON.stringify(result)}`);

    return result.text as string;
  }
