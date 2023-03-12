import { TodosAccess } from '../dataLayer/todoAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

// TODO: Implement businessLogic


const logger = createLogger('TodosAccess')
const attachmentUtils = new AttachmentUtils()
const todosAccess = new TodosAccess()

// create todo function
export async function createTodo(
    newTodo: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {
    logger.info('Create todo function called')

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
    const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
    const newItem = {
        userId,
        todoId,
        createdAt,
        done:false,
        attachmentUrl: s3AttachmentUrl,
        ...newTodo
    }

    return await todosAccess.createTodoItem(newItem)
}
   
// get todo function


export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos for user', { userId })
    return todosAccess.getAllTodos(userId)
  }


// update todo function
export async function updateTodo(
    todoId: string,
    updateTodoRequest: UpdateTodoRequest,
    userId: string
  ): Promise<void> {
    logger.info('Updating todo', { todoId, updateTodoRequest })
    await todosAccess.updateTodoItem(todoId, updateTodoRequest, userId)
  }
  
//  delete todo function
export async function deleteTodo(
    todoId: string,
    userId: string
  ): Promise<void> {
    logger.info('Deleting todo', { todoId })
    await todosAccess.deleteTodoItem(todoId, userId)
  }

// create attachment presigned url
export async function createAttachmentPresignedUrl(
    todoId: string,
    userId: string
  ): Promise<string> {
    logger.info('Generating upload url', { todoId })
    const todo = await todosAccess.getTodoItem(todoId, userId)
    if (!todo) {
      throw new createError.NotFound(`Todo with id ${todoId} not found`)
    } else if (todo.userId !== userId) {
      throw new createError.Unauthorized(
        `User ${userId} is not authorized to access todo ${todoId}`
      )
    } else if (todo.attachmentUrl) {
      throw new createError.BadRequest(`Todo ${todoId} already has an attachment`)
    } else {
      logger.info('Todo exists and has no attachment', { todoId })
    }
  
    return attachmentUtils.getUploadUrl(todoId)
  }
   