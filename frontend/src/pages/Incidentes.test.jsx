import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock de la API para que el test no dependa del backend
vi.mock('../api/incidentes', () => ({
    listarIncidentes: vi.fn(() => Promise.resolve([])),
    crearIncidente: vi.fn(() => Promise.resolve({})),
}))

import Incidentes from './Incidentes'

describe('Formulario de Registro de Incidente - Campo Gravedad', () => {

    beforeEach(() => {
        // El componente lee el usuario desde localStorage
        localStorage.setItem('user', JSON.stringify({ id: 1, nombre: 'Test', rol: 'funcionario' }))
    })

    it('muestra la casilla Gravedad al abrir el formulario', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        // Abrir el formulario
        await user.click(screen.getByText('+ Nuevo incidente'))

        // Verificar que el select de Gravedad existe
        expect(screen.getByLabelText(/gravedad/i)).toBeInTheDocument()
    })

    it('despliega las opciones al hacer click en Gravedad', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))

        const selectGravedad = screen.getByLabelText(/gravedad/i)
        await user.click(selectGravedad)

        // Verificar que las 4 opciones están disponibles
        expect(screen.getByRole('option', { name: 'Leve' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Media' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Grave' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Muy grave' })).toBeInTheDocument()
    })

    it('refleja la opción elegida en el campo Gravedad', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))

        const selectGravedad = screen.getByLabelText(/gravedad/i)

        // Seleccionar "Grave"
        await user.selectOptions(selectGravedad, 'grave')

        // Verificar que la opción queda seleccionada
        expect(selectGravedad).toHaveValue('grave')
        expect(screen.getByRole('option', { name: 'Grave' }).selected).toBe(true)
    })

})


describe('Formulario de Registro de Incidente - Campo Fecha', () => {

    beforeEach(() => {
        localStorage.setItem('user', JSON.stringify({ id: 1, nombre: 'Test', rol: 'funcionario' }))
    })

    it('muestra la casilla Fecha del incidente al abrir el formulario', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))

        expect(screen.getByPlaceholderText('Seleccione fecha')).toBeInTheDocument()
    })

    it('despliega el calendario al hacer click en el campo Fecha', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))
        await user.click(screen.getByPlaceholderText('Seleccione fecha'))

        // Verifica que el calendario se despliega
        expect(document.querySelector('.react-datepicker')).toBeInTheDocument()
    })

    it('refleja la fecha seleccionada en el campo Fecha', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))
        await user.click(screen.getByPlaceholderText('Seleccione fecha'))

        // Selecciona el primer día válido disponible en el calendario
        const diasDisponibles = document.querySelectorAll(
            '.react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)'
        )
        await user.click(diasDisponibles[0])

        // Verifica que el campo ya no está vacío
        const input = screen.getByPlaceholderText('Seleccione fecha')
        expect(input.value).not.toBe('')
    })

})

describe('Formulario de Registro de Incidente - Campo Ubicación', () => {

    beforeEach(() => {
        localStorage.setItem('user', JSON.stringify({ id: 1, nombre: 'Test', rol: 'funcionario' }))
    })

    it('muestra la casilla Ubicación al abrir el formulario', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))

        expect(screen.getByLabelText(/ubicación/i)).toBeInTheDocument()
    })

    it('despliega la lista de ubicaciones al hacer click', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))

        const selectUbicacion = screen.getByLabelText(/ubicación/i)
        await user.click(selectUbicacion)

        expect(screen.getByRole('option', { name: 'Patio principal' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Sala de clases' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Casino' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Biblioteca' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Gimnasio' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Pasillo' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Baños' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Entrada' })).toBeInTheDocument()
    })

    it('refleja la ubicación seleccionada en el campo', async () => {
        const user = userEvent.setup()
        render(<Incidentes />)

        await user.click(screen.getByText('+ Nuevo incidente'))

        const selectUbicacion = screen.getByLabelText(/ubicación/i)
        await user.selectOptions(selectUbicacion, 'Sala de clases')

        expect(selectUbicacion).toHaveValue('Sala de clases')
        expect(screen.getByRole('option', { name: 'Sala de clases' }).selected).toBe(true)
    })

})