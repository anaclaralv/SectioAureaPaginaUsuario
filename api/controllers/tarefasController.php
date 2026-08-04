<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class TarefasController {
    private $tarefa;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->tarefa = new Tarefa($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->tarefa->read($id_usuario);
        
        $tarefas = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($tarefas, $row);
        }
        
        echo json_encode($tarefas);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->tarefa->id_tarefa = $id;
        $this->tarefa->id_usuario = $id_usuario;
        
        if($this->tarefa->readOne()) {
            echo json_encode([
                "id_tarefa" => $this->tarefa->id_tarefa,
                "nome_tarefa" => $this->tarefa->nome_tarefa,
                "dificuldade" => $this->tarefa->dificuldade,
                "prazo" => $this->tarefa->prazo
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Tarefa não encontrada"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->nome_tarefa)) {
            http_response_code(400);
            echo json_encode(["message" => "Nome da tarefa é obrigatório"]);
            return;
        }
        
        $this->tarefa->nome_tarefa = $data->nome_tarefa;
        $this->tarefa->dificuldade = $data->dificuldade ?? 'Médio';
        $this->tarefa->prazo = $data->prazo ?? null;
        $this->tarefa->id_usuario = $id_usuario;
        
        if($this->tarefa->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Tarefa criada com sucesso",
                "id_tarefa" => $this->tarefa->id_tarefa
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar tarefa. Verifique se o usuário existe."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->tarefa->id_tarefa = $id;
        $this->tarefa->id_usuario = $id_usuario;
        
        if(!$this->tarefa->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Tarefa não encontrada"]);
            return;
        }
        
        $this->tarefa->nome_tarefa = $data->nome_tarefa ?? $this->tarefa->nome_tarefa;
        $this->tarefa->dificuldade = $data->dificuldade ?? $this->tarefa->dificuldade;
        $this->tarefa->prazo = $data->prazo ?? $this->tarefa->prazo;
        
        if($this->tarefa->update()) {
            echo json_encode(["message" => "Tarefa atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar tarefa"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->tarefa->id_tarefa = $id;
        $this->tarefa->id_usuario = $id_usuario;
        
        if($this->tarefa->delete()) {
            echo json_encode(["message" => "Tarefa deletada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar tarefa"]);
        }
    }
}
?>