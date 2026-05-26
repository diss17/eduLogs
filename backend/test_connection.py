"""
Script para validar conexión a NeonDB y crear tablas iniciales.
Úsalo para verificar que todo está configurado correctamente.
"""
import sys
from pathlib import Path

# Add the backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine, Base
from app.models import Usuario, Alumno, Incidente
from sqlalchemy import text


def main():
    print("=" * 60)
    print("eduLogs - Database Validation Script")
    print("=" * 60)

    try:
        # Test connection with timeout
        print("\n[1/3] Probando conexión a NeonDB (timeout 10s)...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Conexión exitosa a la base de datos")

        # Create tables
        print("\n[2/3] Creando tablas...")
        Base.metadata.create_all(bind=engine)
        print("✓ Tablas creadas exitosamente")

        # Verify tables
        print("\n[3/3] Verificando tablas creadas...")
        with engine.connect() as conn:
            # Get all tables
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            expected_tables = ['usuarios', 'alumnos', 'incidentes', 'incidente_alumnos']
            
            for table in expected_tables:
                if table in tables:
                    columns = inspector.get_columns(table)
                    col_names = [col['name'] for col in columns]
                    print(f"  ✓ Tabla '{table}' - Columnas: {', '.join(col_names)}")
                else:
                    print(f"  ✗ Tabla '{table}' NO ENCONTRADA")
                    return False

        print("\n" + "=" * 60)
        print("✓ Validación completada exitosamente")
        print("=" * 60)
        print("\nPróximos pasos:")
        print("1. Ejecutar: uvicorn app.main:app --reload")
        print("2. Abrir http://localhost:8000/docs para Swagger UI")
        return True

    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        print("\nVerifica que:")
        print("1. .env está configurado correctamente")
        print("2. DATABASE_URL apunta a NeonDB")
        print("3. Las dependencias están instaladas")
        print("4. Tu IP está permitida en NeonDB (Security → IP Allowlist)")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
