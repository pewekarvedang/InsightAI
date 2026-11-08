import os
import ollama

DEFAULT_GEMMA_MODELS = [
    "gemma4",
    "gemma:4b",
    "gemma3:4b",
    "gemma2:2b",
    "gemma2:9b",
    "gemma2",
    "gemma:2b",
    "gemma:7b",
    "gemma",
]

_active_model = os.environ.get("OLLAMA_MODEL", "gemma3:4b")


def get_installed_models() -> list:
    """Retrieve list of currently downloaded models from local Ollama instance."""
    try:
        resp = ollama.list()
        if hasattr(resp, "models"):
            return [m.model for m in resp.models if hasattr(m, "model")]
    except Exception:
        pass
    return []


def get_active_model() -> str:
    """Determine the active model to query, prioritizing configured and installed Gemma variants."""
    global _active_model

    # 1. If explicitly set in environment
    if "OLLAMA_MODEL" in os.environ and os.environ["OLLAMA_MODEL"].strip():
        return os.environ["OLLAMA_MODEL"].strip()

    # 2. Check if active model is already installed
    installed = get_installed_models()
    if installed:
        if _active_model in installed:
            return _active_model
        # Check if any preferred Gemma variant is installed
        for pref in DEFAULT_GEMMA_MODELS:
            for inst in installed:
                if inst and (pref == inst or inst.startswith(pref)):
                    return inst
        return installed[0]

    return _active_model


def set_active_model(model_name: str) -> str:
    """Update the active Ollama model in runtime memory."""
    global _active_model
    if model_name and model_name.strip():
        _active_model = model_name.strip()
    return _active_model


def ask_gemma(prompt: str) -> str:
    """Send a prompt to the local Gemma model via Ollama and return the generated text.
    Handles dynamic model selection, auto-fallback across installed models, and error safety.
    """
    model = get_active_model()
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        return response["message"]["content"]
    except Exception:
        # Check if any other installed model can respond
        installed = get_installed_models()
        for alt_model in installed:
            if alt_model != model:
                try:
                    response = ollama.chat(
                        model=alt_model,
                        messages=[{"role": "user", "content": prompt}],
                    )
                    set_active_model(alt_model)
                    return response["message"]["content"]
                except Exception:
                    continue

        return (
            f"AI report unavailable: Could not connect to Ollama or model '{model}' is not pulled. "
            f"Run `ollama run {model}` to download and start the model."
        )
