import subprocess
import sys
import os
import nltk
import spacy
from pathlib import Path

def install_requirements():
    """Install all required packages."""
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def download_nltk_data():
    """Download required NLTK data."""
    print("Downloading NLTK data...")
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('averaged_perceptron_tagger')

def download_spacy_model():
    """Download required spaCy model."""
    print("Downloading spaCy model...")
    try:
        spacy.load('en_core_web_sm')
    except OSError:
        spacy.cli.download('en_core_web_sm')

def create_directories():
    """Create necessary directories."""
    print("Creating directories...")
    directories = [
        'logs',
        'data',
        'models'
    ]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)

def setup_database():
    """Initialize the database."""
    print("Setting up database...")
    db_path = Path("chat.db")
    if not db_path.exists():
        print("Database will be created on first run.")

def main():
    """Run the complete setup process."""
    print("Starting setup process...")
    
    # Change to the backend directory
    os.chdir(Path(__file__).parent)
    
    # Run setup steps
    install_requirements()
    download_nltk_data()
    download_spacy_model()
    create_directories()
    setup_database()
    
    print("\nSetup completed successfully!")
    print("\nTo start the server, run:")
    print("uvicorn main:app --reload --port 8000")

if __name__ == "__main__":
    main() 