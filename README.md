# 📅 Booking Pro - Sistema SaaS de Reservas y Agenda

**Booking Pro** es una plataforma SaaS completa diseñada para profesionales (doctores, barberos, consultores) que necesitan gestionar su agenda y permitir que sus clientes reserven citas en línea automáticamente, sin cruces de horarios y respetando sus reglas de negocio.

## 🚀 Características Principales

### 🔐 Panel Administrativo (Back-Office)
* **Gestión de Servicios:** Creación, edición y eliminación de servicios con precio y duración variable.
* **Calendario Visual:** Vista mensual interactiva con resumen diario de actividades.
* **Gestión de Citas:** Agendamiento manual, visualización de detalles y cancelación.
* **Configuración de Horarios:** Control total de disponibilidad (Días de apertura/cierre y rango de horas específico por día).
* **Dashboard Inteligente:** Indicadores de estado (Abierto/Cerrado) en tiempo real según la hora actual.

### 🌍 Portal Público de Reservas (Front-Office)
* **Link Personalizado:** URL única para cada profesional (`/book/:id`).
* **Motor de Disponibilidad:** Cálculo matemático en tiempo real de huecos libres ("Slots") basado en la duración del servicio.
* **Prevención de Conflictos:** Algoritmo que impide "Double Booking" (empalmes de citas).
* **Soporte de Zonas Horarias:** Manejo correcto de fechas (UTC vs Local) para evitar errores de desfase de días.
* **Privacidad:** Los clientes ven huecos libres pero no los datos de otros pacientes.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React.js + Vite
* **Estilos:** Tailwind CSS
* **Base de Datos & Auth:** Supabase (PostgreSQL)
* **Manejo de Fechas:** date-fns
* **Iconos:** react-icons
* **Routing:** React Router DOM

---

Desarrollado por Luis Gabriel - Ingeniero en Sistemas
