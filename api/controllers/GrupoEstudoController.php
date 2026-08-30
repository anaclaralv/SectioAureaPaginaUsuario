<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class GrupoEstudoController {
    private $grupo;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->grupo = new GrupoEstudo($db);
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
        $stmt = $this->grupo->read($id_usuario);
        
        $grupos = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['membros'] = json_decode($row['membros']) ?? [];
            $row['temas'] = json_decode($row['temas']) ?? [];
            $row['duvidas'] = json_decode($row['duvidas']) ?? [];
            $row['reunioes'] = json_decode($row['reunioes']) ?? [];
            $row['flashcards_compartilhados'] = json_decode($row['flashcards_compartilhados']) ?? [];
            
            // Aliases para camelCase do frontend
            $row['linkMeet'] = $row['link_meet'] ?? '';
            $row['dataCriacao'] = $row['data_criacao'] ?? '';
            $row['flashcardsCompartilhados'] = $row['flashcards_compartilhados'];
            
            array_push($grupos, $row);
        }
        
        echo json_encode($grupos);
    }
    
    public function buscar($id) {
        if (is_numeric($id)) {
            $this->grupo->id_grupo = $id;
            $found = $this->grupo->readOne();
        } else {
            $found = $this->grupo->readByCode($id);
        }
        
        if($found) {
            $membros = json_decode($this->grupo->membros) ?? [];
            $temas = json_decode($this->grupo->temas) ?? [];
            $duvidas = json_decode($this->grupo->duvidas) ?? [];
            $reunioes = json_decode($this->grupo->reunioes) ?? [];
            $flashcards = json_decode($this->grupo->flashcards_compartilhados) ?? [];
            
            echo json_encode([
                "id_grupo" => $this->grupo->id_grupo,
                "id_usuario" => $this->grupo->id_usuario,
                "nome" => $this->grupo->nome,
                "materia" => $this->grupo->materia,
                "codigo" => $this->grupo->codigo,
                "link_meet" => $this->grupo->link_meet,
                "linkMeet" => $this->grupo->link_meet,
                "membros" => $membros,
                "temas" => $temas,
                "duvidas" => $duvidas,
                "reunioes" => $reunioes,
                "notas" => $this->grupo->notas,
                "flashcards_compartilhados" => $flashcards,
                "flashcardsCompartilhados" => $flashcards,
                "data_criacao" => $this->grupo->data_criacao,
                "dataCriacao" => $this->grupo->data_criacao
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Grupo de estudo não encontrado"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->nome) || empty($data->codigo)) {
            http_response_code(400);
            echo json_encode(["message" => "Nome e Código são obrigatórios"]);
            return;
        }
        
        $this->grupo->id_usuario = $id_usuario;
        $this->grupo->nome = $data->nome;
        $this->grupo->materia = $data->materia ?? 'Geral';
        $this->grupo->codigo = $data->codigo;
        $this->grupo->link_meet = $data->linkMeet ?? '';
        
        $membrosDefault = [["nome" => "Você (Criador)", "email" => "", "papel" => "Líder"]];
        $this->grupo->membros = isset($data->membros) ? (is_string($data->membros) ? $data->membros : json_encode($data->membros, JSON_UNESCAPED_UNICODE)) : json_encode($membrosDefault, JSON_UNESCAPED_UNICODE);
        $this->grupo->temas = isset($data->temas) ? (is_string($data->temas) ? $data->temas : json_encode($data->temas, JSON_UNESCAPED_UNICODE)) : '[]';
        $this->grupo->duvidas = isset($data->duvidas) ? (is_string($data->duvidas) ? $data->duvidas : json_encode($data->duvidas, JSON_UNESCAPED_UNICODE)) : '[]';
        $this->grupo->reunioes = isset($data->reunioes) ? (is_string($data->reunioes) ? $data->reunioes : json_encode($data->reunioes, JSON_UNESCAPED_UNICODE)) : '[]';
        $this->grupo->notas = $data->notas ?? '';
        
        if (isset($data->flashcardsCompartilhados)) {
            $this->grupo->flashcards_compartilhados = is_string($data->flashcardsCompartilhados) ? $data->flashcardsCompartilhados : json_encode($data->flashcardsCompartilhados, JSON_UNESCAPED_UNICODE);
        } elseif (isset($data->flashcards_compartilhados)) {
            $this->grupo->flashcards_compartilhados = is_string($data->flashcards_compartilhados) ? $data->flashcards_compartilhados : json_encode($data->flashcards_compartilhados, JSON_UNESCAPED_UNICODE);
        } else {
            $this->grupo->flashcards_compartilhados = '[]';
        }
        
        $data_criacao = $data->dataCriacao ?? date('Y-m-d H:i:s');
        $timestamp = strtotime($data_criacao);
        $this->grupo->data_criacao = ($timestamp !== false) ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');
        
        if($this->grupo->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Grupo de estudo criado com sucesso",
                "id_grupo" => $this->grupo->id_grupo
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar grupo de estudo."]);
        }
    }
    
    public function atualizar($id) {
        $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->grupo->id_grupo = $id;
        
        if(!$this->grupo->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Grupo de estudo não encontrado"]);
            return;
        }
        
        $this->grupo->nome = $data->nome ?? $this->grupo->nome;
        $this->grupo->materia = $data->materia ?? $this->grupo->materia;
        $this->grupo->link_meet = $data->linkMeet ?? ($data->link_meet ?? $this->grupo->link_meet);
        
        if (isset($data->membros)) {
            $this->grupo->membros = is_string($data->membros) ? $data->membros : json_encode($data->membros, JSON_UNESCAPED_UNICODE);
        }
        if (isset($data->temas)) {
            $this->grupo->temas = is_string($data->temas) ? $data->temas : json_encode($data->temas, JSON_UNESCAPED_UNICODE);
        }
        if (isset($data->duvidas)) {
            $this->grupo->duvidas = is_string($data->duvidas) ? $data->duvidas : json_encode($data->duvidas, JSON_UNESCAPED_UNICODE);
        }
        if (isset($data->reunioes)) {
            $this->grupo->reunioes = is_string($data->reunioes) ? $data->reunioes : json_encode($data->reunioes, JSON_UNESCAPED_UNICODE);
        }
        if (isset($data->notas)) {
            $this->grupo->notas = $data->notas;
        }
        
        if (isset($data->flashcardsCompartilhados)) {
            $this->grupo->flashcards_compartilhados = is_string($data->flashcardsCompartilhados) ? $data->flashcardsCompartilhados : json_encode($data->flashcardsCompartilhados, JSON_UNESCAPED_UNICODE);
        } elseif (isset($data->flashcards_compartilhados)) {
            $this->grupo->flashcards_compartilhados = is_string($data->flashcards_compartilhados) ? $data->flashcards_compartilhados : json_encode($data->flashcards_compartilhados, JSON_UNESCAPED_UNICODE);
        }
        
        if($this->grupo->update()) {
            echo json_encode(["message" => "Grupo de estudo atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar grupo de estudo."]);
        }
    }
    
    public function deletar($id) {
        $this->getUserId();
        $this->grupo->id_grupo = $id;
        
        if($this->grupo->delete()) {
            echo json_encode(["message" => "Grupo de estudo deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar grupo de estudo."]);
        }
    }
}
?>
