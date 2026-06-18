"""Script para poblar la tabla alumnos con datos ficticios chilenos.

Uso:
    python seed_alumnos.py --dry-run          # preview sin escribir
    python seed_alumnos.py                    # inserta 50 alumnos
    python seed_alumnos.py --count 30 --start 51   # agrega 30 mas (51-80)
"""
import argparse
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

from app.database import SessionLocal
from app.models import Alumno

NOMBRES = [
    "Benjamín", "Mateo", "Vicente", "Joaquín", "Lucas", "Martín", "Emilio",
    "Tomás", "Agustín", "Ignacio", "Isidora", "Clementina", "Florencia",
    "Emilia", "Maite", "Luisa", "Antonella", "Trini", "Renata", "Josefina",
    "Catalina", "Antonia", "Dominga", "Elisa",
]

APELLIDOS = [
    "González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras",
    "Silva", "Martínez", "Sanhueza", "Sepúlveda", "Castillo", "Ramírez",
    "Reyes", "Cortés", "Flores", "Herrera", "Vargas", "Jiménez", "Tapia",
    "Rivera", "Fuentes", "Álvarez", "Vásquez",
]

GRADOS = [
    "1° Básico A", "1° Básico B",
    "2° Básico A", "2° Básico B",
    "3° Básico A", "3° Básico B",
    "4° Básico A", "4° Básico B",
    "5° Básico A", "5° Básico B",
    "6° Básico A", "6° Básico B",
    "7° Básico A", "7° Básico B",
    "8° Básico A", "8° Básico B",
    "1° Medio A", "1° Medio B", "1° Medio C",
    "2° Medio A", "2° Medio B", "2° Medio C",
    "3° Medio A", "3° Medio B",
    "4° Medio A", "4° Medio B", "4° Medio C", "4° Medio D",
]


def parse_args():
    p = argparse.ArgumentParser(
        description="Poblar la tabla alumnos con datos ficticios chilenos."
    )
    p.add_argument("--count", type=int, default=50, help="Cantidad de alumnos a generar")
    p.add_argument("--domain", type=str, default="edulogs.cl", help="Dominio del email")
    p.add_argument("--start", type=int, default=1, help="Numero inicial para el email")
    p.add_argument("--seed", type=int, default=42, help="Semilla aleatoria (reproducibilidad)")
    p.add_argument("--dry-run", action="store_true", help="Solo mostrar, no escribir en BD")
    return p.parse_args()


def generar_alumnos(count, start, domain, seed):
    random.seed(seed)
    alumnos = []
    for i in range(start, start + count):
        email = f"alumno.{i:03d}@{domain}"
        alumnos.append(
            Alumno(
                email=email,
                nombre=random.choice(NOMBRES),
                apellido=random.choice(APELLIDOS),
                grado=random.choice(GRADOS),
            )
        )
    return alumnos


def main():
    args = parse_args()
    alumnos = generar_alumnos(args.count, args.start, args.domain, args.seed)
    emails = {a.email for a in alumnos}

    db = SessionLocal()
    try:
        existentes = {
            e for (e,) in db.query(Alumno.email).filter(Alumno.email.in_(emails)).all()
        }
        a_insertar = [a for a in alumnos if a.email not in existentes]
        saltados = len(alumnos) - len(a_insertar)

        if args.dry_run:
            print(
                f"\nDRY-RUN: {len(a_insertar)} a insertar, "
                f"{saltados} ya existen, {len(alumnos)} total\n"
            )
            print(f"{'email':<28} {'nombre':<14} {'apellido':<14} {'grado'}")
            print("-" * 72)
            for a in a_insertar:
                print(f"{a.email:<28} {a.nombre:<14} {a.apellido:<14} {a.grado}")
            return True

        db.add_all(a_insertar)
        db.commit()
        print(f"\nInsertados: {len(a_insertar)}")
        print(f"Saltados (ya existentes): {saltados}")
        print(f"Total procesado: {len(alumnos)}")
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
