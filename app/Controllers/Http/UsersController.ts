import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class UsersController {
  /**
   * Método para registrar um novo usuário
   */
  public async register({ request, response }: HttpContextContract) {
    const { username, email, password } = request.only(['username', 'email', 'password'])

    try {
      // Verificar se o usuário já existe
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        return response.badRequest({ message: 'E-mail já registrado' })
      }

      // Criptografar a senha
      const hashedPassword = await Hash.make(password)

      // Criar um novo usuário
      const user = await User.create({ username, email, password: hashedPassword })

      return response.created(user)
    } catch (error) {
      console.error('Erro ao registrar conta:', error)
      return response.badRequest({ message: 'Erro em registrar conta', error })
    }
  }

  /**
   * Método para fazer login
   */
  public async login({ request, response, auth }: HttpContextContract) {
    try {
      const { username, password } = request.only(['username', 'password'])
      console.log('username recebido:', username)

      // Verificar se o usuário existe
      const user = await User.findBy('username', username)
      if (!user) {
        return response.unauthorized({ message: 'Credenciais inválidas' })
      }

      // Verificar se a senha está correta
      const passwordValid = await Hash.verify(user.password, password)
      if (!passwordValid) {
        return response.unauthorized({ message: 'Credenciais inválidas' })
      }

      // Gerar token opaco
      const token = await auth.use('api').generate(user)

      return response.ok({ message: 'Login bem-sucedido', token })
    } catch (error) {
      console.error('Falha no login:', error)
      return response.badRequest({ message: 'Falha no login', error })
    }
  }


  public async show({ auth, response }: HttpContextContract) {
    try {
      const user = auth.user
      
      if (!user) {
        console.log('Usuário não autenticado')
        return response.unauthorized({ error: 'Usuário não autenticado' })
      }

      await user.load('profile')
      return response.ok(user) 
    } catch (error) {
      console.error('Erro ao obter usuário:', error)
      return response.internalServerError({ error: 'Erro ao obter usuário', details: error.message })
    }
  }
}
