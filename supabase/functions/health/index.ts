Deno.serve(() => new Response(JSON.stringify({ok:true,service:"medlens",timestamp:new Date().toISOString()}),{headers:{"content-type":"application/json"}}));
