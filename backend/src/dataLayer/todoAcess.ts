import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
      private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
      private readonly todosTable = process.env.TODOS_TABLE,
      private readonly userIdIndex = process.env.USER_ID_INDEX
    ) {}
  
    async getAllTodos(userId: string): Promise<TodoItem[]> {
      logger.info('Getting all todos for user', { userId })
  
      const result = await this.docClient
        .query({
          TableName: this.todosTable,
          IndexName: this.userIdIndex,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
        .promise()
  
      const items = result.Items
      return items as TodoItem[]
    }
  
    async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
      await this.docClient
        .put({
          TableName: this.todosTable,
          Item: todoItem
        })
        .promise()
  
      return todoItem
    }
  
    async updateTodoItem(
      todoId: string,
      todoUpdate: TodoUpdate,
      userId: string
    ): Promise<void> {
      logger.info('Updating todo', { todoId, todoUpdate })
  
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
          ExpressionAttributeValues: {
            ':name': todoUpdate.name,
            ':dueDate': todoUpdate.dueDate,
            ':done': todoUpdate.done
          },
          ExpressionAttributeNames: {
            '#name': 'name'
          },
          ReturnValues: 'UPDATED_NEW'
        })
        .promise()
    }
  
    async deleteTodoItem(todoId: string, userId: string): Promise<void> {
      logger.info('Deleting todo', { todoId })
  
      await this.docClient
        .delete({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          }
        })
        .promise()
    }
  
    async getTodoItem(todoId: string, userId: string): Promise<TodoItem> {
      logger.info('Getting todo', { todoId })
  
      const result = await this.docClient
        .get({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          }
        })
        .promise()
  
      return result.Item as TodoItem
    }
  
    async updateTodoAttachmentUrl(
      todoId: string,
      userId: string,
      attachmentUrl: string
    ): Promise<void> {
      logger.info('Updating todo attachment url', { todoId, attachmentUrl })
  
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          UpdateExpression: 'set attachmentUrl = :attachmentUrl',
          ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl
          }
        })
        .promise()
    }
  }
  
//   function createDynamoDBClient() {
//     if (process.env.IS_OFFLINE) {
//       logger.info('Creating a local DynamoDB instance')
//       return new XAWS.DynamoDB.DocumentClient({
//         region: 'localhost',
//         endpoint: 'http://localhost:8000'
//       })
//     }
  
//     return new XAWS.DynamoDB.DocumentClient()
//   }
  
