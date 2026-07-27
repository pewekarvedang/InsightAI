from .llm import ask_gemma
from .prompts import business_prompt


def generate_ai_report(metrics):
    prompt = business_prompt(metrics)
    return ask_gemma(prompt)