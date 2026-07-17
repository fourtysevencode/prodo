from fastapi import FastAPI, Request
from pydantic import basemodel

#  Serve HTML on / later
# environment = jinja2.Environment()
# template = environment.from_string("Hello, {{ name }}!")


app = FastAPI()


@app.get("/")
async def root():
    return "alive"







#class Default(WorkerEntrypoint):
#    async def fetch(self, request):
#        import asgi
#        return await asgi.fetch(app, request.js_object, self.env)
