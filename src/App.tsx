import React from 'react';
import { Button, Classes, Intent, Spinner } from "@blueprintjs/core";
import "./Solver.scss";
import classNames from "classnames";
import { range, delay } from "lodash"

type SudokuCell = number | undefined;
type SudokuRow = [SudokuCell, SudokuCell, SudokuCell, SudokuCell, SudokuCell, SudokuCell, SudokuCell, SudokuCell, SudokuCell];
type SudokuTable = [SudokuRow, SudokuRow, SudokuRow, SudokuRow, SudokuRow, SudokuRow, SudokuRow, SudokuRow, SudokuRow];

interface State {
  table: SudokuTable;
  originalTable: SudokuTable;
  solving: boolean;
}

const getEmptyTable = () => {
  const board = range(0, 9).map(_ => range(0, 9).map(_ => undefined)) as SudokuTable;
  return board;
}

const initialTable: SudokuTable = [
  [8, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
  [undefined, undefined, 3, 6, undefined, undefined, undefined, undefined, undefined],
  [undefined, 7, undefined, undefined, 9, undefined, 2, undefined, undefined],
  [undefined, 5, undefined, undefined, undefined, 7, undefined, undefined, undefined],
  [undefined, undefined, undefined, undefined, 4, 5, 7, undefined, undefined],
  [undefined, undefined, undefined, 1, undefined, undefined, undefined, 3, undefined],
  [undefined, undefined, 1, undefined, undefined, undefined, undefined, 6, 8],
  [undefined, undefined, 8, 5, undefined, undefined, undefined, 1, undefined],
  [undefined, 9, undefined, undefined, undefined, undefined, 4, undefined, undefined]
]

export class Solver extends React.PureComponent<{}, State> {


  private solutionFound = false;

  public state: State = {
    originalTable: initialTable,
    table: initialTable,
    solving: false,
  }

  public render() {
    const { solving } = this.state;
    return <div className={classNames(Classes.DARK, "content")}>
      <div className="title">Sudoku Solver</div>
      {this.renderBoard()}
      <div className="buttons">
        <Button className="solve-button" disabled={solving} intent={Intent.PRIMARY} text={solving ? <Spinner size={8} /> : "Solve"} onClick={this.solve} />
        <Button text="Clear" disabled={solving} onClick={this.clear} />
      </div>
    </div>
  }

  private renderBoard = () => {
    const { table, solving } = this.state;
    return (
      <div className={classNames("board", {
        "solved": this.solutionFound,
        "solving": solving
      })}>
        {
          table.map((row, idx) => this.renderRow(row, idx))
        }
      </div>
    )
  }

  private renderRow = (row: SudokuRow, rowIndex: number) => {
    const { originalTable } = this.state;
    return (
      <div className="row">
        {
          row.map((value, colIndex) => {
            const isOriginal = originalTable[rowIndex][colIndex] != undefined;
            return <span className={classNames("cell", {
              "original": isOriginal
            })}>{value}</span>
          })
        }
      </div>
    )
  }

  private solve = async () => {
    this.setState({
      solving: true
    })
    this.solutionFound = false;
    const { originalTable } = this.state;
    const table = this.copyBoard(originalTable);
    this.setState({
      table
    }, async () => {
      console.dir(await this.solveHelper(0, 0, table));
      this.setState({
        solving: false
      })
    })
  }

  private clear = () => {
    this.setState({
      table: getEmptyTable()
    });
  }

  private solveHelper: (row: number, col: number, board: SudokuTable) => Promise<any> = async (row, col, board) => {

    if (row > 8 || col > 8 || this.solutionFound) {
      return undefined;
    }

    const advanceRow = col === 8;
    const nextCol = advanceRow ? 0 : col + 1;
    const nextRow = advanceRow ? row + 1 : row;

    if (board[row][col] != undefined) {
      await this.solveHelper(nextRow, nextCol, board);
      return;
    }

    for (let value = 1; value < 10; value++) {
      if (this.solutionFound) {
        return;
      }
      board[row][col] = value;

      if (Math.random() < 0.0025) {
        this.forceUpdate();
        await new Promise((res) => {
          window.setTimeout(res, 0);
        })
      }

      if (this.isValid(board) && row === 8 && col === 8) {
        this.solutionFound = true;
        this.forceUpdate();
        return;
      }

      if (!this.isValid(board) && !this.solutionFound) {
        board[row][col] = undefined;
        continue;
      }

      // valid board, continue
      await this.solveHelper(nextRow, nextCol, board);
      if (!this.solutionFound) {
        board[row][col] = undefined;
      }
    }

    return;
  }

  private isValid = (table: SudokuTable) => {
    const areRowsValid = table.every(row => this.isRowValid(row));
    const areColumnsValid = range(0, 9).every(col => this.isColumnValid(col));
    const areBoxesValid = this.areBoxesValid();

    return areRowsValid && areColumnsValid && areBoxesValid;
  }

  private isColumnValid = (column: number) => {
    const { table } = this.state;
    const col: SudokuCell[] = table.map(row => row[column]);

    return this.isRowValid(col);
  }

  private areBoxesValid = () => {
    for (let row = 0; row < 9; row += 3) {
      for (let column = 0; column < 9; column += 3) {
        if (!this.is3by3BoxValid(row, column)) {
          return false;
        }
      }
    }

    return true;
  }

  private is3by3BoxValid = (row: number, col: number) => {
    const { table } = this.state;
    const cells = [];
    for (let i = row; i < row + 3; i++) {
      for (let j = col; j < col + 3; j++) {
        cells.push(table[i][j]);
      }
    }

    return this.isRowValid(cells);
  }

  private isRowValid = (row: SudokuRow | SudokuCell[]) => {
    return !row.some((cell, index) => cell != undefined && row.indexOf(cell) !== index);
  }

  private copyBoard = (board: SudokuTable) => {
    return board.map(row => [...row]) as SudokuTable;
  }

}

export default Solver;
